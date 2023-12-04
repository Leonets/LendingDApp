use scrypto::prelude::*;

//for both lend and take_back
pub fn assert_resource(res_addr: &ResourceAddress, expect_res_addr: &ResourceAddress){
    assert!(res_addr == expect_res_addr, "Incorrect resource passed in for interacting with the component!");
}

//for lending
pub fn lend_checks(start_epoch: u64, period_length: Decimal, current_epoch: u64, amount_lended: Decimal){
    //if it is not the first time lending then checks epochs and amount
    assert!(
        Decimal::from(start_epoch) + Decimal::from(period_length) <= Decimal::from(current_epoch),
        "No loan accepted if the previous loan period has not yet ended!"
    );
    assert!(
        amount_lended == dec!("0"),
        "No loan accepted if previous is not closed yet!"
    );
}

pub fn lend_amount_checks(num_xrds: Decimal, min: u16, max: u16){
    assert!(
        num_xrds <= Decimal::from(max),
        "No loan approved over 1000xrd at this time!"
    );
    assert!(
        num_xrds >= Decimal::from(min),
        "No loan approved below 100xrd at this time!"
    );
}

//for take_back
pub fn take_back_checks(allowed_amount: Decimal, amount_to_be_returned: &Decimal){
    info!("Minimum amount : {:?} ", allowed_amount);  
    assert!(
        amount_to_be_returned >= &allowed_amount,
        "You cannot get back less than 20% of your loan!"
    );
}




