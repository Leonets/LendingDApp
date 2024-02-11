use scrypto::prelude::*;
use scrypto_avltree::AvlTree;
use crate::utils::*;

#[derive(NonFungibleData, ScryptoSbor)]
struct StaffBadge {
    username: String
}

#[derive(NonFungibleData, ScryptoSbor)]
struct BenefactorBadge {
    #[mutable]
    amount_funded: Decimal
}

#[derive(NonFungibleData, ScryptoSbor)]
struct BadPayerBadge {
    account: String,
    #[mutable]
    amount_to_refund: Decimal,
    #[mutable]
    expected_borrow_epoch_timeline: Decimal,
}


//struct to store and show info about loan/borrow position in each account wallet
#[derive(ScryptoSbor, NonFungibleData)]
pub struct LenderData {
    #[mutable]
    start_lending_epoch: Epoch,
    #[mutable]
    end_lending_epoch: Epoch,
    #[mutable]
    amount: Decimal,
    #[mutable]
    start_borrow_epoch: Epoch,
    #[mutable]
    expected_end_borrow_epoch: Decimal,
    #[mutable]
    end_borrow_epoch: Epoch,
    #[mutable]
    borrow_amount: Decimal
}

//struct to store info about each borrowing position
#[derive(NonFungibleData, ScryptoSbor, Clone)]
pub struct CreditScore {
    account: String,
    #[mutable]
    amount_borrowed: Decimal,
    #[mutable]
    epoch_limit_for_repaying: Decimal,
}


#[derive(NonFungibleData, ScryptoSbor, Clone)]
pub struct Borrower {
    name: String,
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
            borrow => PUBLIC;
            repay => PUBLIC;
            asking_repay => restrict_to: [admin, OWNER];
            clean_data => restrict_to: [admin, OWNER];
            pools => restrict_to: [admin, OWNER];
            fund_main_pool => restrict_to: [admin, OWNER];
            set_reward => restrict_to: [admin, OWNER];
            set_reward_type => restrict_to: [admin, OWNER];
            set_borrow_epoch_max_length => restrict_to: [admin, OWNER];
            set_interest => restrict_to: [admin, OWNER];
            set_period_length => restrict_to: [admin, OWNER];
            set_max_percentage_allowed_for_account  => restrict_to: [admin, OWNER];
            withdraw_earnings => restrict_to: [OWNER];
            withdraw_fees => restrict_to: [admin, OWNER];
            extend_lending_pool => restrict_to: [staff, admin, OWNER];
            extend_borrowing_pool => restrict_to: [staff, admin, OWNER];
            mint_staff_badge => restrict_to: [admin, OWNER];
            recall_staff_badge => restrict_to: [admin, OWNER];
            mint_bad_payer  => restrict_to: [admin, OWNER];
            mint_bad_payer_vault  => restrict_to: [admin, OWNER];
        }
    }
    struct LendingDApp<> {
        lendings: Vault,
        collected_xrd: Vault,
        fee_xrd: Vault,
        donations_xrd: Vault,
        reward: Decimal,
        interest: Decimal,
        borrow_epoch_max_lenght: Decimal,
        max_percentage_allowed_for_account: u32,
        lnd_manager: ResourceManager,
        staff_badge_resource_manager: ResourceManager,
        benefactor_badge_resource_manager: ResourceManager,
        lendings_nft_manager: ResourceManager,
        period_length: Decimal,
        reward_type: String,
        interest_for_lendings: AvlTree<Decimal, Decimal>,
        interest_for_borrowings: AvlTree<Decimal, Decimal>,
        max_borrowing_limit: Decimal,
        borrowers_positions: AvlTree<Decimal, CreditScore>,
        staff: AvlTree<u16, NonFungibleLocalId>,
        borrowers_accounts: Vec<Borrower>,
        late_payers_accounts: Vec<String>,
        late_payers_redeemed_accounts: Vec<String>,
        badpayer_badge_resource_manager: ResourceManager,
        badpayer_vault: Vault,
    }

    impl LendingDApp {
        // given a reward, interest level and a symbol name, creates a ready-to-use Lending dApp
        pub fn instantiate_lending_dapp(
            reward: Decimal,
            interest: Decimal,
            symbol: String,
            period_length: Decimal,
            reward_type: String,
            max_borrowing_limit: Decimal,
        ) -> (Global<LendingDApp>, FungibleBucket, FungibleBucket) {
            
            //data struct for holding interest levels for loan/borrow
            let mut borrow_tree: AvlTree<Decimal, Decimal> = AvlTree::new();
            borrow_tree.insert(Decimal::from(Runtime::current_epoch().number()), interest);
            let mut lend_tree: AvlTree<Decimal, Decimal> = AvlTree::new();
            lend_tree.insert(Decimal::from(Runtime::current_epoch().number()), reward);

            //data struct for holding info about account, expected repaying epoch and amount for borrowers
            let borrowers_positions: AvlTree<Decimal, CreditScore> = AvlTree::new();
            let borrowers_accounts: Vec<Borrower> = Vec::new();
            let staff: AvlTree<u16, NonFungibleLocalId> = AvlTree::new();
            let late_payers_accounts: Vec<String> = Vec::new();
            let late_payers_redeemed_accounts: Vec<String> = Vec::new();

            let (address_reservation, component_address) =
                Runtime::allocate_component_address(LendingDApp::blueprint_id());

            let owner_badge = 
                ResourceBuilder::new_fungible(OwnerRole::None)
                    .metadata(metadata!(init{
                        "name"=>"LendingDapp Owner badge", locked;
                        "icon_url" => Url::of("https://test.zerocollateral.eu/images/logo.jpg"), locked;
                        "description" => "A badge to be used for some extra-special administrative function", locked;
                    }))
                    .divisibility(DIVISIBILITY_NONE)
                    .mint_initial_supply(1);

            let admin_badge = 
                ResourceBuilder::new_fungible(OwnerRole::Updatable(rule!(require(
                    owner_badge.resource_address()
                ))))
                .metadata(metadata!(init{
                    "name"=>"LendingDapp Admin badge", locked;
                    "icon_url" => Url::of("https://test.zerocollateral.eu/images/logo.jpg"), locked;
                    "description" => "A badge to be used for some special administrative function", locked;
                }))
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
                .metadata(metadata!(init{
                    "name" => "LendingDapp Staff_badge", locked;
                    "description" => "A badge to be used for some administrative function", locked;
                    "icon_url" => Url::of("https://test.zerocollateral.eu/images/logo.jpg"), locked;
                }))
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

            let benefactor_badge =
                ResourceBuilder::new_ruid_non_fungible::<BenefactorBadge>(OwnerRole::Updatable(rule!(
                    require(owner_badge.resource_address())
                    || require(admin_badge.resource_address())
                )))
                .metadata(metadata!(init{
                    "name" => "LendingDapp Benefactor_badge", locked;
                    "description" => "A badge to be used for rewarding benefactors", locked;
                    "icon_url" => Url::of("https://test.zerocollateral.eu/images/logo.jpg"), locked;
                }))
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

            let bad_payer =
                ResourceBuilder::new_ruid_non_fungible::<BadPayerBadge>(OwnerRole::Updatable(rule!(
                    require(owner_badge.resource_address())
                        || require(admin_badge.resource_address())
                )))
                .metadata(metadata!(init{
                    "name" => "LendingDapp BadPayer", locked;
                    "description" => "A signal to indicate that the account has not repaid the loan", locked;
                    "icon_url" => Url::of("https://test.zerocollateral.eu/images/badPayer.jpg"), locked;
                }))
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
                    "icon_url" => Url::of("https://test.zerocollateral.eu/images/logoSlimToken.png"), locked;
                }))
                .mint_roles(mint_roles! (
                         minter => rule!(require(global_caller(component_address)));
                         minter_updater => OWNER;
                ))
                .mint_initial_supply(1000);

            // Create a badge to identify this user who lends xrd tokens
            let nft_manager =
                ResourceBuilder::new_ruid_non_fungible::<LenderData>(OwnerRole::None)
                .metadata(metadata!(
                    init {
                        "name" => "LendingDapp NFT", locked;
                        "icon_url" => Url::of("https://test.zerocollateral.eu/images/logoSlimNft.png"), locked;
                        // "icon_url" => Url::of(get_nft_icon_url()), locked;
                        "description" => "An NFT containing information about your liquidity", locked;
                        // "dapp_definitions" => ComponentAddress::try_from_hex("account_tdx_2_12y0nsx972ueel0args3jnapz9qtexyj9vpfqtgh3th4v8z04zht7jl").unwrap(), locked;
                    }
                ))
                .mint_roles(mint_roles!(
                    minter => rule!(require(global_caller(component_address)));
                    minter_updater => rule!(require(global_caller(component_address)));
                ))
                .burn_roles(burn_roles!(
                    burner => rule!(require(global_caller(component_address)));
                    burner_updater => OWNER;
                ))
                // Here we are allowing anyone (AllowAll) to update the NFT metadata.
                // The second parameter (DenyAll) specifies that no one can update this rule.
                .non_fungible_data_update_roles(non_fungible_data_update_roles!(
                    non_fungible_data_updater => rule!(require(global_caller(component_address)));
                    non_fungible_data_updater_updater => OWNER;
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
                    fee_xrd: Vault::new(XRD),
                    donations_xrd: Vault::new(XRD),
                    reward: reward,
                    interest: interest,
                    borrow_epoch_max_lenght: dec!(518000),
                    max_percentage_allowed_for_account: 3,
                    staff_badge_resource_manager: staff_badge,
                    benefactor_badge_resource_manager: benefactor_badge,
                    lendings_nft_manager: nft_manager,
                    period_length: period_length,
                    reward_type: reward_type,
                    interest_for_lendings: lend_tree,
                    interest_for_borrowings: borrow_tree,
                    max_borrowing_limit: max_borrowing_limit,
                    borrowers_positions: borrowers_positions,
                    staff: staff,
                    borrowers_accounts: borrowers_accounts,
                    late_payers_accounts: late_payers_accounts,
                    late_payers_redeemed_accounts: late_payers_redeemed_accounts,
                    badpayer_badge_resource_manager: bad_payer,
                    badpayer_vault: Vault::new(bad_payer.address()),
                }
                .instantiate()
                .prepare_to_globalize(OwnerRole::Updatable(rule!(require(
                    owner_badge.resource_address()
                ))))
                .metadata(metadata!(
                    // roles {
                    //     metadata_setter => rule!(require(owner_badge.resource_address()));
                    //     metadata_setter_updater => rule!(deny_all);
                    //     metadata_locker => rule!(allow_all);
                    //     metadata_locker_updater => rule!(allow_all);
                    // },
                    init {
                        "name" => "LendingDapp", locked;
                        "icon_url" => Url::of("https://test.zerocollateral.eu/images/logo3b.jpg"), locked;
                        "description" => "LendingDapp SmartContract for lending and borrowing service", locked;
                        "claimed_websites" =>  ["https://test.zerocollateral.eu"], locked;
                    }
                ))//specify what this roles means
                .roles(roles!(
                    admin => rule!(require(admin_badge.resource_address()));
                    staff => rule!(require(staff_badge.address()));
                ))
                .with_address(address_reservation)
                .globalize();
 
            return (component, admin_badge, owner_badge);
        }

        //register to the platform
        // pub fn register(&mut self, badge: Option<Bucket>) -> Bucket {
        //     match badge {
        //         Some(user_nft) => {
        //             // Handle the case when there is a value (Some)
        //             // You can access the fields of the Bucket using 'b'
        //             // Additional logic for handling Some(b) case if needed
        //             println!("Registering with badge: {:?}", user_nft);
        //             assert!(true,"You are already registerd !!!");
        //             user_nft
        //         }
        //         None => {
        //             // Handle the case when there is no value (None)
        //             // Additional logic for handling None case if needed
        //             println!("Registering without badge");
        //             // You need to decide what to return in case of None; here, I'm using a default value
        //             //mint an NFT for registering loan/borrowing amount and starting/ending epoch
        //             let lender_badge = self.lendings_nft_manager
        //             .mint_ruid_non_fungible(
        //                 LenderData {
        //                     start_lending_epoch: Epoch::of(0),
        //                     end_lending_epoch: Epoch::of(0),
        //                     amount: dec!("0"),
        //                     start_borrow_epoch: Epoch::of(0),
        //                     expected_end_borrow_epoch: dec!(0),
        //                     end_borrow_epoch: Epoch::of(0),
        //                     borrow_amount: dec!("0")
        //                 }
        //             );
        //             lender_badge
        //         }
        //     }
        // }

        //register to the platform
        pub fn register(&mut self) -> Bucket {
            //mint an NFT for registering loan/borrowing amount and starting/ending epoch
            let lender_badge = self.lendings_nft_manager
            .mint_ruid_non_fungible(
                LenderData {
                    start_lending_epoch: Epoch::of(0),
                    end_lending_epoch: Epoch::of(0),
                    amount: dec!("0"),
                    start_borrow_epoch: Epoch::of(0),
                    expected_end_borrow_epoch: dec!(0),
                    end_borrow_epoch: Epoch::of(0),
                    borrow_amount: dec!("0")
                }
            );
            lender_badge
        }

        //unregister from the platform
        pub fn unregister(&mut self, lender_badge: Bucket) -> Option<Bucket> {
            //burn the NFT, be sure you'll lose all your tokens not reedemed in advance of this operation
            let non_fung_bucket = lender_badge.as_non_fungible();
            let amount_lended = non_fung_bucket.non_fungible::<LenderData>().data().amount;
            lend_ongoing(amount_lended, 10);
            let amount_borrowed = non_fung_bucket.non_fungible::<LenderData>().data().borrow_amount;
            lend_ongoing(amount_borrowed, 10);
            lender_badge.burn();
            None
        }

        //utility for asking borrow repay
        pub fn asking_repay(&mut self) {
            let current_epoch = Decimal::from(Runtime::current_epoch().number());
            let end_epoch = Decimal::from(current_epoch + 10000);
            // let bad_payer_bucket: Option<Bucket>;
            for (_key, value) in self.borrowers_positions.range_back(current_epoch..end_epoch) {
                // Check if the account still exists in the vector of borrowers
                // This means that first we need to check if the borrower has already repaid its loan
                if let Some(_index) = self.borrowers_accounts.iter().position(|borrower| borrower.name == value.account) {
                    // If found, check if it needs to repay
                    info!("Account {} is already a borrower", value.account);
                    match current_epoch > value.epoch_limit_for_repaying {
                        true => {
                            //payment is late
                            info!("user_account is late in paying back: {} amount: {} due at epoch: {} current epoch: {} ", 
                            value.account, value.amount_borrowed, value.epoch_limit_for_repaying, current_epoch);
                            
                            //mint a nft as 'bad payer' and send it to the account
                            let nft = self
                            .badpayer_badge_resource_manager
                            .mint_ruid_non_fungible(BadPayerBadge {
                                account: value.account.clone(),
                                amount_to_refund: value.amount_borrowed,
                                expected_borrow_epoch_timeline: value.epoch_limit_for_repaying,
                            });
                            self.badpayer_vault.put(nft);
                            //TODO send an nft to the bad payer !! 
                            //prepare for sending an nft from tx manifest build inside the frontend
                            // Check if the element is not already in the vector before pushing it
                            if !self.late_payers_accounts.contains(&value.account) {
                                self.late_payers_accounts.push(value.account.clone());
                            }
                        }
                        false => {
                            //payment is not yet late
                            info!("user_account: {} should repay amount: {} before : {} current epoch: {} ", 
                            value.account, value.amount_borrowed, value.epoch_limit_for_repaying, current_epoch);
                        }
                    }
                } else {
                    // If not found, it does need to be removed also from borrowers_positions !!
                    // self.borrowers_accounts.push(Borrower { name: String::from(user_account), /* other fields if any */ });
                    info!("Account {} and its position has to be removed as a borrower", value.account);
                }
            }
            // late_payers_accounts
            info!("Late payers accounts before reorg {:?}", self.late_payers_accounts);

            //It needs to find the accounts that:
            // - are present in the late_payer list but not in the borrowers_account list
            // - accounts found has to be inserted in the 'redeemed late payers' for then recalling the nft
            // Find accounts in late_payers_accounts but not in borrowers_accounts
            let accounts_to_redeem: Vec<String> = self.late_payers_accounts
            .iter()
            .filter(|account| !self.borrowers_accounts.iter().any(|borrower| borrower.name == **account))
            .cloned()
            .collect();

            info!("Accounts have repaid {:?}", accounts_to_redeem);
            // Insert the found accounts into late_payers_redeemed_accounts for then recalling the nft
            self.late_payers_redeemed_accounts.extend(accounts_to_redeem);

            // Remove the redeemed accounts from late_payers_accounts
            self.late_payers_accounts.retain(|account| !self.late_payers_redeemed_accounts.contains(account));

            info!("Late payers accounts after reorg {:?}", self.late_payers_accounts);
            info!("Redeemed Late payers accounts after reorg {:?}", self.late_payers_redeemed_accounts);
        }

        //utility for cleaning data after recalling BadPayer NFTs
        pub fn clean_data(&mut self) {
            self.late_payers_redeemed_accounts.clear();
        }


        //lend some xrd
        pub fn lend_tokens(&mut self, loan: Bucket, lender_badge: Bucket) -> (Bucket, Bucket) {
            assert_resource(&lender_badge.resource_address(), &self.lendings_nft_manager.address());

            let non_fung_bucket = lender_badge.as_non_fungible();
            let nft_local_id: NonFungibleLocalId = non_fung_bucket.non_fungible_local_id();
            let start_epoch = non_fung_bucket.non_fungible::<LenderData>().data().start_lending_epoch;
            let amount_lended = non_fung_bucket.non_fungible::<LenderData>().data().amount;

            lend_complete_checks(start_epoch.number(),self.period_length, Runtime::current_epoch().number(), amount_lended, self.reward_type.clone());                    
            let num_xrds = loan.amount();
            lend_amount_checks(num_xrds, 100, 1000);
            info!("Amount of token received: {:?} ", num_xrds);   

            //take the XRD bucket as a new loan and put xrd token in main pool
            self.collected_xrd.put(loan);

            //prepare a bucket with lnd tokens to give back to the user 
            let token_received = self.lendings.take(num_xrds);

            // Update the data on the network
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_lending_epoch", Runtime::current_epoch());
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "end_lending_epoch", Epoch::of(0));
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "amount", num_xrds);

            (token_received, lender_badge)
        }

        //gives back the original xrd 
        pub fn takes_back(&mut self, refund: Bucket, lender_badge: Bucket) -> (Bucket, Option<Bucket>) {
            assert_resource(&lender_badge.resource_address(), &self.lendings_nft_manager.address());

            let lender_data: LenderData = lender_badge.as_non_fungible().non_fungible().data();

            // Verify the user has requested back at least 20% of its current loan
            take_back_checks(lender_data.amount / 5, &refund.amount());

            // Update the amount field
            let remaining_amount_to_return = lender_data.amount - refund.amount(); 
            info!("Remaining tokens to return: {:?} ", remaining_amount_to_return);   

            //take the LND bucket to close the loan, and returns XRD tokens from the main pool
            let amount_to_be_returned = refund.amount();
            self.lendings.put(refund);

            //calculate interest
            let interest_totals = calculate_interests(
                &self.reward_type, &self.reward,
                lender_data.start_lending_epoch.number(),
                &amount_to_be_returned, &self.interest_for_lendings);
            info!("Calculated interest {} ", interest_totals);

            //total amount to return 
            let amount_returned = amount_to_be_returned + interest_totals;
            info!("XRD tokens given back: {:?} ", amount_returned);  

            // Paying fees
            let fees = calculate_fees(amount_returned);
            self.fee_xrd.put(self.collected_xrd.take(fees));
            //total net amount to return
            let net_returned = self.collected_xrd.take(amount_returned-fees);

            let nft_local_id: NonFungibleLocalId = lender_badge.as_non_fungible().non_fungible_local_id();
            // Update the data on the network
            if remaining_amount_to_return == dec!("0") {
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "end_lending_epoch", Runtime::current_epoch());
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "amount", remaining_amount_to_return);
                return (net_returned,Some(lender_badge))                
            } else {
                // self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_lending_epoch", Runtime::current_epoch());
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "amount", remaining_amount_to_return);
                return (net_returned,Some(lender_badge))
            }

        }

        //get some xrd  
        pub fn borrow(&mut self, amount_requested: Decimal, lender_badge: Bucket, user_account: String, borrow_expected_length: Decimal,) -> (Bucket, Option<Bucket>) {
            assert_resource(&lender_badge.resource_address(), &self.lendings_nft_manager.address());

            // Verify the user has not an open borrow
            let lender_data: LenderData = lender_badge.as_non_fungible().non_fungible().data();

            // Applying rules: close the previous borrow first, checks the max percentage of the total, checks the max limit 
            borrow_checks(lender_data.borrow_amount, amount_requested, 
                self.collected_xrd.amount() * self.max_percentage_allowed_for_account / 100,
                self.collected_xrd.amount() * 50 / 100,
                self.badpayer_vault.amount(), self.max_percentage_allowed_for_account);
            // TODO max_limit should be self.collected_xrd.amount() * 50 / 100 (50% of main vault) 
            // or self.max_borrowing_limit * 100 / 100 (100% of what has been specified as max_borrowing_amount by admin)
            borrow_epoch_max_length_checks(self.borrow_epoch_max_lenght,borrow_expected_length);

            //prepare for ordering and looking for the next expiring borrow
            let epoch = Decimal::from(Runtime::current_epoch().number()) + borrow_expected_length;
            let credit_score = CreditScore {
                account: user_account.clone(),
                amount_borrowed: amount_requested,
                epoch_limit_for_repaying: epoch,
            };
            self.borrowers_positions.insert(epoch, credit_score);
            //saving the current account as a borrower account
            self.borrowers_accounts.push(Borrower { name: String::from(user_account.clone()), /* other fields... */ });
            info!("Register borrower user account: {:?} amount {:?} epoch for repaying {:?} ", user_account.clone(), amount_requested, epoch);  

            //paying fees in advance
            let fees = calculate_fees(amount_requested);
            self.fee_xrd.put(self.collected_xrd.take(fees));

            //take the XRD from the main pool to borrow to the user
            let xrd_to_return = self.collected_xrd.take(amount_requested-fees);

            let nft_local_id: NonFungibleLocalId = lender_badge.as_non_fungible().non_fungible_local_id();
            // Update the data on the network
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_borrow_epoch", Runtime::current_epoch());
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "expected_end_borrow_epoch", epoch);
            self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "borrow_amount", amount_requested);
            return (xrd_to_return,Some(lender_badge))                
        }

        //repay some xrd  
        pub fn repay(&mut self, mut loan_repaied: Bucket, lender_badge: Bucket, user_account: String) -> (Bucket, Option<Bucket>) {
            assert_resource(&lender_badge.resource_address(), &self.lendings_nft_manager.address());

            let lender_data: LenderData = lender_badge.as_non_fungible().non_fungible().data();

            // Verify the user has requested back at least 20% of its current borrowing
            repay_checks(lender_data.amount / 5, loan_repaied.amount());

            //paying fees
            let fees = calculate_fees(loan_repaied.amount());
            //calculate interest
            let amount_returned = loan_repaied.amount();
            
            //calculate interest
            let interest_totals = calculate_interests(
                &self.reward_type, &self.interest,
                lender_data.start_lending_epoch.number(),
                &amount_returned, &self.interest_for_borrowings);

            info!("Calculated interest {:?} ", interest_totals);  
            let amount_to_be_returned = lender_data.borrow_amount + interest_totals;
            info!("Actual amount to be repaied (without interest): {:?} ", lender_data.borrow_amount); 
            info!("Amount to be repaied with interest: {:?} ", amount_to_be_returned);
            let total = amount_to_be_returned + fees;
            info!("Total Amount to repay with interest and fees: {:?} ", total);  

            //paying fees
            self.fee_xrd.put(loan_repaied.take(fees));

            let remaining:Decimal = total-amount_returned;
            info!("Amount repaied : {:?}  Amount remaining : {:?} ", amount_returned, remaining);   

            //Update the data on the network
            let nft_local_id: NonFungibleLocalId = lender_badge.as_non_fungible().non_fungible_local_id();
            //repay the loan
            if remaining <= dec!("0") {
                info!("Setting loan as closed ");  
                self.collected_xrd.put(loan_repaied.take(total-fees));
                info!("Exceed Amount returned back to user : {:?}  ", loan_repaied.amount()); 
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "borrow_amount", dec!("0"));
                //remove the user account as a current borrower      
                self.borrowers_accounts.retain(|borrower| borrower.name != user_account);

                //Update epoch on NFT
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "start_borrow_epoch", Epoch::of(0));
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "expected_end_borrow_epoch", dec!(0));
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "end_borrow_epoch", Runtime::current_epoch());    
            } else  {
                info!("Missing token to close loan  {:?} ", remaining);
                self.collected_xrd.put(loan_repaied.take(loan_repaied.amount()-fees)); 
                self.lendings_nft_manager.update_non_fungible_data(&nft_local_id, "borrow_amount", remaining);
            }  
            return (loan_repaied,Some(lender_badge))                
        }

        //vault size
        pub fn pools(&mut self)  {
            info!("Main Pool: {:?} ", self.collected_xrd.amount());  
            info!("Fees: {:?} ", self.fee_xrd.amount());  
            info!("Donations: {:?} ", self.donations_xrd.amount());  
        }

        //for funding the main pool
        pub fn fund_main_pool(&mut self, fund: Bucket)  {
            info!("Fund received to fund the main vault: {:?} ", fund.amount());  
            self.collected_xrd.put(fund);
        }

        //for development funding
        pub fn fund(&mut self, fund: Bucket) -> Bucket {
            //take the XRD bucket for funding the development
            let amount = fund.amount();
            info!("Fund received to support development: {:?} ", amount);  
            self.donations_xrd.put(fund);

            //TODO manage subsequent funding
            let benefactor_badge_bucket: Bucket = self
            .benefactor_badge_resource_manager
            .mint_ruid_non_fungible(BenefactorBadge {
                amount_funded: amount
            });
            benefactor_badge_bucket
        }

        //for admin only
        // set the reward for lenders
        pub fn set_reward(&mut self, reward: Decimal) {
            self.reward = reward;
            self.interest_for_lendings.insert(Decimal::from(Runtime::current_epoch().number()), reward);
        }

        // set the reward for borrowers
        pub fn set_interest(&mut self, interest: Decimal) {
            self.interest = interest;
            self.interest_for_borrowings.insert(Decimal::from(Runtime::current_epoch().number()), interest);
        }

        //set minimum period length between consecutive lendings
        //TODO to be removed
        pub fn set_period_length(&mut self, period_length: Decimal) {
            self.period_length = period_length
        }

        //withdraw some of the funds deposited for fund the development
        pub fn withdraw_earnings(&mut self, amount: Decimal) -> Bucket {
            self.donations_xrd.take(amount)
        }

        //set the reward type, if fixed or timebased
        pub fn set_reward_type(&mut self, reward_type: String) {
            self.reward_type = reward_type
        }

        //set the max lenght of a borrow in epochs
        pub fn set_borrow_epoch_max_length(&mut self, borrow_epoch_max_lenght: Decimal) {
            self.borrow_epoch_max_lenght = borrow_epoch_max_lenght
        }

        //set the max lenght of a borrow in epochs
        pub fn set_max_percentage_allowed_for_account(&mut self, max_percentage_allowed_for_account: u32) {
            self.max_percentage_allowed_for_account = max_percentage_allowed_for_account
        }

        //withdraw the fees generated by the component
        pub fn withdraw_fees(&mut self, amount: Decimal) -> Bucket {
            self.fee_xrd.take(amount)
        }

        //mint a staff for a new staff member
        pub fn mint_staff_badge(&mut self, username: String) -> Bucket {
            let staff_badge_bucket: Bucket = self
                .staff_badge_resource_manager
                .mint_ruid_non_fungible(StaffBadge {
                    username: username.clone(),
                });

            let id = staff_badge_bucket.as_non_fungible().non_fungible_local_id();
            let key = self.staff.get_length().to_u16().unwrap()+1; 
            info!("Saving staff badge with key : {:?} and id {:?} for the username: {:?}  ",key, id, username);
            self.staff.insert(key, id);

            staff_badge_bucket
        }

        //init the bad payer vault with the amount of maximum badpayer allowed
        pub fn mint_bad_payer_vault(&mut self) {
            let _max = 50 / self.max_percentage_allowed_for_account;
            info!("Ready to mint BadPayer: {}", _max);
            // for index in 1..= max  {
            //     info!("Current number: {}", index);
            //     let nft = self
            //     .badpayer_badge_resource_manager
            //     .mint_ruid_non_fungible(BadPayerBadge {
            //         account: index.to_string(),
            //         amount_to_refund: dec!(0),
            //         expected_borrow_epoch_timeline: dec!(0),
            //     });
            //     self.badpayer_vault.put(nft);
            // }
        }

        //mint a bad payer nft
        pub fn mint_bad_payer(&mut self) -> Bucket {
            let mut bad_payer_bucket = self.badpayer_badge_resource_manager.create_empty_bucket();
            for index in 1..=5 {
                println!("Current number: {}", index);
                let nft = self
                .badpayer_badge_resource_manager
                .mint_ruid_non_fungible(BadPayerBadge {
                    account: index.to_string(),
                    amount_to_refund: dec!(1),
                    expected_borrow_epoch_timeline: dec!(1),
                });
                bad_payer_bucket.put(nft);
            }
            bad_payer_bucket
        }

        //TODO code not working
        pub fn recall_staff_badge(&mut self) {
            for (_key, value) in self.staff.range(1..self.staff.get_length().to_u16().unwrap()) {
                let vault_address: ResourceAddress = self.staff_badge_resource_manager.address();
                info!("getting staff badge n° : {:?} ", _key);
                info!("ready to try to recall the following LocalId: {:?} ", value);

                //TODO code not working
                // it is not currently possible to source the vault address from the Radix Engine, 
                // so it must be determined from an off-ledger indexer/API, 
                // and passed in through a transaction.
                let _recalled_bucket: Bucket = scrypto_decode(&ScryptoVmV1Api::object_call_direct(
                    vault_address.as_node_id(),
                    NON_FUNGIBLE_VAULT_RECALL_NON_FUNGIBLES_IDENT,
                    scrypto_encode(&NonFungibleVaultRecallNonFungiblesInput {
                        non_fungible_local_ids: indexset!(value),
                    })
                    .unwrap(),
                ))
                .unwrap();
            }
        }

        //extend the pool for accept lendings
        pub fn extend_lending_pool(&mut self, size_extended: Decimal) {
            self.lendings.put(self.lnd_manager.mint(size_extended));
        }

        //extend the maximum amount for allowing borrows
        pub fn extend_borrowing_pool(&mut self, size_extended: Decimal) {
            assert!(
                self.max_borrowing_limit + size_extended >= self.collected_xrd.amount() * 50 / 100,
                "Max borrowing limit cannot be higher than 50% of total fund in the main pool !!"
            );
            // adds to the level
            self.max_borrowing_limit = self.max_borrowing_limit + size_extended;
            //TODO need to check the available amount in the pool before extending the max 
        }

    }
}