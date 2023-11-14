use scrypto::prelude::*;
use scrypto_math::*;

#[derive(NonFungibleData, ScryptoSbor)]
struct StaffBadge {
    username: String,
}

#[derive(ScryptoSbor, NonFungibleData)]
pub struct LenderData {
    #[mutable]
    start_lending_epoch: Epoch,
    #[mutable]
    end_lending_epoch: Epoch,
    #[mutable]
    amount: Decimal
}

#[blueprint]
mod lending_dapp {
    enable_method_auth! {
        roles {
            admin => updatable_by: [OWNER];
            staff => updatable_by: [admin, OWNER];
        },
        methods {
            register => PUBLIC;
            unregister => PUBLIC;
            lend_tokens => PUBLIC;
            takes_back => PUBLIC;
            fund => PUBLIC;
            set_reward => restrict_to: [admin, OWNER];
            set_period_length => restrict_to: [admin, OWNER];
            withdraw_earnings => restrict_to: [OWNER];
            extend_lending_pool => restrict_to: [staff, admin, OWNER];
            mint_staff_badge => restrict_to: [admin, OWNER];
        }
    }
    struct LendingDApp {
        lendings: Vault,
        collected_xrd: Vault,
        reward: Decimal,
        lnd_manager: ResourceManager,
        staff_badge_resource_manager: ResourceManager,
        lendings_nft_manager: ResourceManager,
        period_length: Decimal,
    }

    impl LendingDApp {
        // given a reward level and a symbol name, creates a ready-to-use Lending dApp
        pub fn instantiate_lending_dapp(
            reward: Decimal,
            symbol: String,
            period_length: Decimal,
        ) -> (Global<LendingDApp>, FungibleBucket, FungibleBucket) {
            
            let (address_reservation, component_address) =
                Runtime::allocate_component_address(LendingDApp::blueprint_id());

            let owner_badge = 
                ResourceBuilder::new_fungible(OwnerRole::None)
                    .metadata(metadata!(init{"name"=>"LendingDapp Owner badge", locked;}))
                    .divisibility(DIVISIBILITY_NONE)
                    .mint_initial_supply(1);

            let admin_badge = 
                ResourceBuilder::new_fungible(OwnerRole::Updatable(rule!(require(
                    owner_badge.resource_address()
                ))))
                .metadata(metadata!(init{"name"=>"LendingDapp Admin badge", locked;}))
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
                .metadata(metadata!(init{"name" => "LendingDapp Staff_badge", locked;}))
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

            // create a new LND resource, with a fixed quantity of 1000
            let lendings_bucket = 
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
                .mint_initial_supply(1000);

            // Create a badge to identify this user who lends xrd tokens
            let lendings_nft_manager =
                ResourceBuilder::new_ruid_non_fungible::<LenderData>(OwnerRole::None)
                .metadata(metadata!(
                    init {
                        "name" => "LendingDapp NFT", locked;
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
                // Here we are allowing anyone (AllowAll) to update the NFT metadata.
                // The second parameter (DenyAll) specifies that no one can update this rule.
                .non_fungible_data_update_roles(non_fungible_data_update_roles!(
                    non_fungible_data_updater => AccessRule::AllowAll;
                    non_fungible_data_updater_updater => AccessRule::DenyAll;
                )) 
                // .deposit_roles(deposit_roles!(
                //     depositor => rule!(deny_all);
                //     depositor_updater => rule!(deny_all);
                // ))                 
                .create_with_no_initial_supply();

            // populate a LendingDApp struct and instantiate a new component
            let component = 
                Self {
                    lnd_manager: lendings_bucket.resource_manager(),
                    lendings: Vault::with_bucket(lendings_bucket.into()),
                    collected_xrd: Vault::new(XRD),
                    reward: reward,
                    staff_badge_resource_manager: staff_badge,
                    lendings_nft_manager: lendings_nft_manager,
                    period_length: period_length,
                }
                .instantiate()
                .prepare_to_globalize(OwnerRole::Updatable(rule!(require(
                    owner_badge.resource_address()
                ))))
                //specify what this roles means
                .roles(roles!(
                    admin => rule!(require(admin_badge.resource_address()));
                    staff => rule!(require(staff_badge.address()));
                ))
                .with_address(address_reservation)
                .globalize();

            return (component, admin_badge, owner_badge);
        }

        //register to the platform
        pub fn register(&mut self) -> Bucket {
            //mint an NFT for registering loan amount and starting epoch
            let lender_badge = self.lendings_nft_manager
            .mint_ruid_non_fungible(
                LenderData {
                    start_lending_epoch: Epoch::of(0),
                    end_lending_epoch: Epoch::of(0),
                    amount: dec!("0")
                }
            );
            
            lender_badge
        }

        //unregister from the platform
        pub fn unregister(&mut self, lender_badge: Bucket) -> Option<Bucket> {
            //burn the NFT, be sure you'll lose all your tokens not reedemed in advance of this operation
            lender_badge.burn();
            None
        }

        //lend some xrd
        pub fn lend_tokens(&mut self, payment: Bucket, lender_badge: Bucket) -> (Bucket, Bucket) {
            let nft_local_id: NonFungibleLocalId = lender_badge.as_non_fungible().non_fungible_local_id();

            // let option_metadata = self.lendings_nft_manager.get_metadata(&nft_local_id).ok();  
            // for nft in name_nft.as_non_fungible().non_fungibles::<DomainName>() {
            //     total_deposit_amount.checked_add(nft.data().deposit_amount);
            // }

            let start_epoch_nft = lender_badge.as_non_fungible().non_fungible::<LenderData>().data().start_lending_epoch;
            let amount_nft = lender_badge.as_non_fungible().non_fungible::<LenderData>().data().amount;

            match start_epoch_nft.number() != 0 {
                true => {
                    //if it is not the first time lending then checks epochs and amount
                    assert!(
                        Decimal::from(start_epoch_nft.number()) + Decimal::from(self.period_length) <= Decimal::from(Runtime::current_epoch().number()),
                        "No lending accepted if previous is previous than 1728 epoch (aroung 1 month)!"
                    );
                    assert!(
                        amount_nft == dec!("0"),
                        "No lending accepted if previous is not closed yet!"
                    );
                }
                false => (),
            }

            //take the XRD bucket as a new loan and put xrd token in main pool
            let num_xrds = payment.amount();

            assert!(
                num_xrds <= Decimal::from(1000),
                "No loan approved over 1000xrd at this time!"
            );

            //put received token in the bucket
            self.collected_xrd.put(payment);

            //prepare a bucket with lnd tokens to give back to the user 
            let value_backed = self.lendings.take(num_xrds);
            info!("Amount of loan received: {:?} ", num_xrds);   

            // Update the data on the network
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_lending_epoch", Runtime::current_epoch());
            // self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "end_lending_epoch", None);
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "amount", num_xrds);

            (value_backed, lender_badge)
        }

        //gives back the original xrd 
        pub fn takes_back(&mut self, refund: Bucket, lender_badge: Bucket) -> (Bucket, Option<Bucket>) {
            // assert!(
            //     lender_badge.resource_address()
            //     == self.lendings_nft_manager.resource_address(),
            //     "Incorrect resource passed in for requesting back the loan"
            // );

            // Verify the user has requested back at least 20% 
            let lender_data: LenderData = lender_badge.as_non_fungible().non_fungible().data();
            // Calculate the minimum amount (20%) of the current loan
            let half_amount_due = lender_data.amount / 5;
            info!("Minimum amount : {:?} ", half_amount_due);  

            assert!(
                refund.amount() >= half_amount_due,
                "You cannot get back less than 20% of your loan!"
            );

            // Update the amount field
            let remaining_amount = lender_data.amount - refund.amount(); 
            info!("Remaining tokens to reedem: {:?} ", remaining_amount);   

            //take the LND bucket to close the loan, and get XRD tokens from the main pool
            let num_xrds_to_return = refund.amount();
            self.lendings.put(refund);

            //calculate reward
            let reward = num_xrds_to_return + (num_xrds_to_return*self.reward/100);
            //give back XRD token plus reward %
            info!("Loan tokens given back: {:?} ", reward);  
            let xrd_to_return = self.collected_xrd.take(reward);

            let nft_local_id: NonFungibleLocalId =
            lender_badge.as_non_fungible().non_fungible_local_id();
            //when all the loan amount has taken back then the nft gets burned
            if remaining_amount == dec!("0") {
                // lender_badge.burn();
                // (xrd_to_return,None)
                // Update the data on the network
                // self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_lending_epoch", Runtime::current_epoch());
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "end_lending_epoch", Runtime::current_epoch());
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "amount", remaining_amount);
                return (xrd_to_return,Some(lender_badge))                
            } else {
                // Update the data on the network
                // self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_lending_epoch", Runtime::current_epoch());
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "amount", remaining_amount);
                return (xrd_to_return,Some(lender_badge))
            }

        }


        //for members funding
        pub fn fund(&mut self, fund: Bucket)  {
            //take the XRD bucket for funding the development
            info!("Fund received to support development: {:?} ", fund.amount());  
            self.collected_xrd.put(fund);
        }

        //for admin only
        // set the reward for lenders
        pub fn set_reward(&mut self, reward: Decimal) {
            self.reward = reward
        }

        //set minimum period length between consecutive lendings
        pub fn set_period_length(&mut self, period_length: Decimal) {
            self.period_length = period_length
        }

        //withdraw all the funds deposited
        pub fn withdraw_earnings(&mut self, amount: Decimal) -> Bucket {
            self.collected_xrd.take(amount)
        }

        //mint a staff for a new staff member
        pub fn mint_staff_badge(&mut self, username: String) -> Bucket {
            let staff_badge_bucket: Bucket = self
                .staff_badge_resource_manager
                .mint_ruid_non_fungible(StaffBadge {
                    username: username,
                });
            staff_badge_bucket
        }

        //extend the pool for accept lendings
        pub fn extend_lending_pool(&mut self, size_extended: Decimal) {
            // mint some more lending tokens requires an admin or staff badge
            self.lendings.put(self.lnd_manager.mint(size_extended));
        }

        //financial function
        fn _calculate_interest(epochs: i32, percentage: f64, capital: f64) -> f64 {
            let daily_rate = percentage / 100.0 / (365.0 * 24.0 * 12.0); // Assuming interest is calculated daily
            let compound_factor = (1.0 + daily_rate).powi(epochs);
            let interest = capital * (compound_factor - 1.0);
            interest
        }

    }


}
