use lending_dapp::lending::test_bindings::*;
// use lending_dapp::lending::lending_dapp::*;
// use lending_dapp::LenderData;
use scrypto::*;
use scrypto_test::prelude::*;

#[test]
fn lending_dapp_lend_tokens_test() -> Result<(), RuntimeError> {
    // Arrange
    let mut env = TestEnvironment::new();
    let package_address = Package::compile_and_publish(this_package!(), &mut env)?;

    // Act
    let bucket1 = BucketFactory::create_fungible_bucket(
        XRD,
        100.into(),
        Mock,
        &mut env
    )?;

    let reward = Decimal::from(5);
    let interest=  Decimal::from(10);
    let symbol = String::from("LND");
    let period_length = Decimal::from(1728);
    let reward_type = "fixed";

    let (mut lendingdapp, _admin_badge, _staff_badge) = ZeroCollateral::instantiate_lending_dapp(
        reward, interest,symbol, period_length, reward_type.to_string(), dec!(1000), package_address, &mut env,)?;

    // Act
    let user_nft = lendingdapp.register(&mut env)?;
    // Act
    let (lnd_bucket, nft_bucket) = lendingdapp.lend_tokens(bucket1, user_nft, &mut env)?;

    // Verify that the NFT's amount matches the expected amount
    assert_eq!(nft_bucket.amount(&mut env)?, dec!("1"));
    info!("Nft: {:?} ", _nft_bucket);  

    // Assert
    assert_eq!(lnd_bucket.amount(&mut env)?, dec!("100"));
    Ok(())
}



#[test]
fn lending_dapp_takes_back_test() -> Result<(), RuntimeError> {
    // Arrange
    let mut env = TestEnvironment::new();

    let package_address = Package::compile_and_publish(this_package!(), &mut env)?;

    // Act
    let bucket1 = BucketFactory::create_fungible_bucket(
        XRD,
        100.into(),
        Mock,
        &mut env
    )?;

    // Act
    let initial_fund = BucketFactory::create_fungible_bucket(XRD,100.into(),Mock,&mut env)?;

    let reward = Decimal::from(5);
    let interest=  Decimal::from(10);
    let symbol = String::from("LND");
    let period_length = Decimal::from(1728);
    let reward_type = "fixed";

    let (mut lendingdapp, _admin_badge, _owner_badge) = ZeroCollateral::instantiate_lending_dapp(
        reward, interest, symbol, period_length, reward_type.to_owned(), dec!(1000), package_address, &mut env,)?;
    
    // Act
    let _unused = env.with_auth_module_disabled(|env| {
        /* Auth Module is disabled just before this point */
        let _ = lendingdapp.fund_main_pool(initial_fund, env);
        /* Kernel modules are reset just after this point. */
    });
    // Act
    let user_nft = lendingdapp.register(&mut env)?;
    // Act
    let (lnd_bucket, received_nft) = lendingdapp.lend_tokens(bucket1, user_nft, &mut env)?;

    // Verify that the received buckets amount matches the expected amount
    // Assert
    assert_eq!(received_nft.amount(&mut env)?, dec!("1"));

    info!("Nft: {:?} ", _nft_bucket);  

    // Act
    let (xrd_bucket, nft_option) = lendingdapp.takes_back(lnd_bucket, received_nft, &mut env)?;

    match nft_option {
        Some(nft) => {
            // Verify that the nft has been correctly burned
            assert_eq!(nft.amount(&mut env)?, dec!("1"));
            // Verify that the reward has been received
            assert_eq!(xrd_bucket.amount(&mut env)?, dec!("95"));
        }
        None => {
            // Verify that the reward has been received
            assert_eq!(xrd_bucket.amount(&mut env)?, dec!("95"));
        }
    }

    Ok(())
}
