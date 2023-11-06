use lending_dapp::test_bindings::*;
use lending_dapp::LenderData;
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
    let (lnd_bucket, _nft_bucket) = lendingdapp.lend_tokens(bucket1, &mut env)?;

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

    let reward = Decimal::from(5);
    let symbol = String::from("LND");

    let (mut lendingdapp, _admin_badge, _staff_badge) = LendingDApp::instantiate_lending_dapp(
        reward,
        symbol,
        package_address,
        &mut env,
    )?;

    // Act
    let (lnd_bucket, _nft_bucket) = lendingdapp.lend_tokens(bucket1, &mut env)?;

    // Verify that the received buckets amount matches the expected amount
    // Assert
    assert_eq!(_nft_bucket.amount(&mut env)?, dec!("1"));

    info!("Nft: {:?} ", _nft_bucket);  

    // Assert
    assert_eq!(lnd_bucket.amount(&mut env)?, dec!("100"));
    Ok(())
}
