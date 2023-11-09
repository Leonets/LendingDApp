use lending_dapp::test_bindings::*;
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
    let symbol = String::from("LND");

    let (mut lendingdapp, _admin_badge, _staff_badge) = LendingDApp::instantiate_lending_dapp(
        reward,
        symbol,
        package_address,
        &mut env,
    )?;

    // Act
    let (lnd_bucket, _nft_bucket) = lendingdapp.lend_tokens(bucket1, None, &mut env)?;

    // Verify that the NFT's amount matches the expected amount
    assert_eq!(_nft_bucket.amount(&mut env)?, dec!("1"));

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
    let symbol = String::from("LND");

    let (mut lendingdapp, _admin_badge, _owner_badge) = LendingDApp::instantiate_lending_dapp(
        reward,
        symbol,
        package_address,
        &mut env,
    )?;

    // let bucket2 = BucketFactory::create_non_fungible_bucket(
    //     lendingdapp.lendings_nft_manager.address,
    //     1.into(),
    //     Mock,
    //     &mut env
    // )?;

    
    // Act
    lendingdapp.fund(initial_fund, &mut env)?;

    // Act
    let (lnd_bucket, received_nft) = lendingdapp.lend_tokens(bucket1, None, &mut env)?;

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
            assert_eq!(xrd_bucket.amount(&mut env)?, dec!("105"));
        }
        None => {
            // Verify that the reward has been received
            assert_eq!(xrd_bucket.amount(&mut env)?, dec!("105"));
        }
    }

    Ok(())
}
