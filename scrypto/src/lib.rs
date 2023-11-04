use scrypto::prelude::*;

#[derive(NonFungibleData, ScryptoSbor)]
struct StaffBadge {
    employee_name: String,
}

#[derive(ScryptoSbor, NonFungibleData)]
pub struct LenderData {
    minted_on: Epoch,
    amount: Decimal
}

#[blueprint]
mod lending_dapp {
    // enable_method_auth! {
    //     roles {
    //         admin => updatable_by: [OWNER];
    //         staff => updatable_by: [admin, OWNER];
    //     },
    //     methods {
    //         lend_token => PUBLIC;
    //         lend_tokens => PUBLIC;
    //         takes_back => PUBLIC;
    //         withdraw_earnings => restrict_to: [OWNER];
    //     }
    // }
    struct LendingDApp {
        lendings: Vault,
        collected_xrd: Vault,
        reward: Decimal,
        lnd_resource_manager: ResourceManager,
        staff_badge_resource_manager: ResourceManager,
        lenders_badge_manager: ResourceManager,
    }

    impl LendingDApp {
        // given a price in XRD, creates a ready-to-use Lending dApp
        pub fn instantiate_lending_dapp(
            reward: Decimal,
            symbol: String,
        ) -> (Global<LendingDApp>, FungibleBucket, FungibleBucket) {
            
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(LendingDApp::blueprint_id());

            let owner_badge = ResourceBuilder::new_fungible(OwnerRole::None)
                .metadata(metadata!(init{"name"=>"owner badge", locked;}))
                .divisibility(DIVISIBILITY_NONE)
                .mint_initial_supply(1);

            let admin_badge = ResourceBuilder::new_fungible(OwnerRole::Updatable(rule!(require(
                owner_badge.resource_address()
            ))))
            .metadata(metadata!(init{"name"=>"admin badge", locked;}))
            .mint_roles(mint_roles! (
                     minter => rule!(require(global_caller(component_address)));
                     minter_updater => OWNER;
            ))
            .divisibility(DIVISIBILITY_NONE)
            .mint_initial_supply(1);

            let staff_badge =
                ResourceBuilder::new_ruid_non_fungible::<StaffBadge>(OwnerRole::Updatable(rule!(
                    require(owner_badge.resource_address())
                        || require(admin_badge.resource_address())
                )))
                .metadata(metadata!(init{"name" => "staff_badge", locked;}))
                .mint_roles(mint_roles! (
                         minter => rule!(require(global_caller(component_address)));
                         minter_updater => OWNER;
                ))
                .burn_roles(burn_roles! (
                    burner => rule!(require(admin_badge.resource_address()));
                    burner_updater => OWNER;
                ))
                .recall_roles(recall_roles! {
                    recaller => rule!(require(admin_badge.resource_address()));
                    recaller_updater => OWNER;
                })
                .create_with_no_initial_supply();

            // create a new LND resource, with a fixed quantity of 100
            let bucket_of_lending_tokens = 
                ResourceBuilder::new_fungible(OwnerRole::None)
                .metadata(metadata!(init{
                    "name" => "LendingToken", locked;
                    "symbol" => symbol, locked;
                    "description" => "A token to use to receive back the loan", locked;
                }))
                .mint_roles(mint_roles! (
                         minter => rule!(require(global_caller(component_address)));
                         minter_updater => OWNER;
                ))
                .mint_initial_supply(100);

            // Create a badge to identify this user who lends xrd tokens
            let lenders_badge_manager =
                ResourceBuilder::new_ruid_non_fungible::<LenderData>(OwnerRole::None)
                .metadata(metadata!(
                    init {
                        "name" => "XRD lender badge manager", locked;
                    }
                ))
                .mint_roles(mint_roles!(
                    minter => rule!(require(global_caller(component_address)));
                    minter_updater => rule!(require(global_caller(component_address)));
                ))
                .burn_roles(burn_roles!(
                    burner => rule!(require(global_caller(component_address)));
                    burner_updater => rule!(deny_all);
                )) 
                // .deposit_roles(deposit_roles!(
                //     depositor => rule!(deny_all);
                //     depositor_updater => rule!(deny_all);
                // ))                 
                .create_with_no_initial_supply();


            // populate a LendingDApp struct and instantiate a new component
            let component = Self {
                lnd_resource_manager: bucket_of_lending_tokens.resource_manager(),
                staff_badge_resource_manager: staff_badge,
                lendings: Vault::with_bucket(bucket_of_lending_tokens.into()),
                collected_xrd: Vault::new(XRD),
                reward: reward,
                lenders_badge_manager: lenders_badge_manager,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::Updatable(rule!(require(
                owner_badge.resource_address()
            ))))
            // .roles(roles!(
            //     admin => rule!(require(admin_badge.resource_address()));
            //     staff => rule!(require(staff_badge.address()));
            // ))
            .with_address(address_reservation)
            .globalize();
            return (component, admin_badge, owner_badge);
        }


        pub fn lend_tokens(&mut self, payment: Bucket,) -> (Bucket, Bucket) {
            //take the XRD bucket as a new loan and put xrd token in main pool
            let num_xrds = payment.amount();

            // Convert 100 to Decimal for comparison
            let max_allowed = Decimal::from(100);
            assert!(
                num_xrds <= max_allowed,
                "Not loan approved over 100xrd at this time!"
            );

            self.collected_xrd.put(payment);

            //give back lnd token plus reward %
            // let mut value_backed = self.lendings.take((num_xrds).round(2,RoundingMode::ToPositiveInfinity));
            let value_backed = self.lendings.take(num_xrds);
            info!("Loan token received: {:?} ", num_xrds);   

            let lender_badge = self.lenders_badge_manager
            .mint_ruid_non_fungible(
                LenderData {
                    minted_on: Runtime::current_epoch(),
                    amount: num_xrds
                }
            );

            (value_backed, lender_badge)
        }

        pub fn take_back(&mut self, refund: Bucket) -> Bucket {
            //take the LND bucket to close the loan, and get xrd token from the main pool
            let num_xrds_to_return = refund.amount();
            self.lendings.put(refund);

            //calculate reward
            let reward = num_xrds_to_return + (num_xrds_to_return*self.reward/100);
            //give back xtr token plus reward %
            let xrd_to_return = self.collected_xrd.take(reward);
            info!("Loan token given back: {:?} ", xrd_to_return.amount());   

            xrd_to_return
        }

        pub fn takes_back(&mut self, refund: Bucket, lender_badge: Bucket) -> (Bucket, Bucket) {
            // assert!(
            //     lender_badge.resource_address()
            //     == self.lenders_badge_manager.resource_address(),
            //     "Incorrect resource passed in for loan terms"
            // );

            // Verify we are being sent at least 10xrd
            let lender_data: LenderData = lender_badge.as_non_fungible().non_fungible().data();
            // Calculate 50% of the amount due
            let half_amount_due = lender_data.amount / 5;
            info!("Minimum amount : {:?} ", half_amount_due);  

            // assert!(
            //     refund.amount() >= half_amount_due,
            //     "You cannot get back less than 20% of your loan!"
            // );

            // Update the amount field
            let remaining_amount = lender_data.amount - refund.amount(); 

            //take the LND bucket to close the loan, and get xrd token from the main pool
            let num_xrds_to_return = refund.amount();
            self.lendings.put(refund);

            //calculate reward
            let reward = num_xrds_to_return + (num_xrds_to_return*self.reward/100);
            //give back xtr token plus reward %
            let xrd_to_return = self.collected_xrd.take(reward);
            info!("Loan token given back: {:?} ", xrd_to_return);   

            lender_badge.burn();
            // Mint a new NFT with the updated data
            let updated_lender_data = LenderData {
                minted_on: lender_data.minted_on,
                amount: remaining_amount
            };
            let _new_lender_badge = self.lenders_badge_manager
                .mint_ruid_non_fungible(updated_lender_data);

            (xrd_to_return, _new_lender_badge)
        }


        pub fn withdraw_earnings(&mut self) -> Bucket {
            self.collected_xrd.take_all()
        }

        pub fn fund(&mut self, fund: Bucket)  {
            //take the XRD bucket for funding the development
            let xrds_funded = fund.amount();
            info!("Fund received token given back: {:?} ", xrds_funded);  
            self.collected_xrd.put(fund);
        }
    }
}
