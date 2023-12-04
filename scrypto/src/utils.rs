use scrypto::prelude::*;
use scrypto_avltree::AvlTree;
use scrypto_math::*;
use crate::lending::Reward;

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

//for borrowings
pub fn borrow_checks(
        borrow_amount: Decimal, amount_requested: Decimal, 
        max_amount_allowed: Decimal, max_limit: Decimal){

    assert!(borrow_amount == dec!("0"), "You cannot borrow before repaying back first");
    info!("Amount of token borrowed : {:?} ", amount_requested);   
    
    // Check the first limit  
    info!("Maximum amount allowed : {:?} ", max_amount_allowed);  
    assert!(
        max_amount_allowed >= amount_requested,
        "You cannot borrow more than amount allowed : {:?} ", max_amount_allowed
    );
    // Calculate the second limit  
    info!("Max limit : {:?} ", max_limit);  
    assert!(
        max_limit + amount_requested >= max_limit,
        "There is not availabilty for new borrowings!"
    );
}



//for repay
pub fn repay_checks(allowed_amount: Decimal, repaied_amount: Decimal){
    info!("Minimum amount : {:?} ", allowed_amount);  
    assert!(
        repaied_amount >= allowed_amount,
        "You cannot refund less than 20% of your loan!"
    );
}



//calculate interest
pub fn calculate_interests(
    reward_type: &String, 
    reward_fixed: &Decimal, 
    start_lending_epoch: u64, 
    amount_to_be_returned: &Decimal, 
    interest_for_lendings: &AvlTree<Decimal, Decimal>) -> Decimal {

    // Dereference the Decimal values
    let amount = *amount_to_be_returned;
    let fixed = *reward_fixed;
    let current_epoch = Runtime::current_epoch().number(); 
        
        //calculate interest to be repaied with specified reward type 
    return match Reward::from_str(reward_type) {
        Ok(reward) => {
            match reward {
                Reward::Fixed => {
                    info!("Handle Fixed reward logic here");
                    amount*fixed/100
                }
                Reward::TimeBased => {
                    info!("Handle TimeBased logic here from epoch {} to epoch {} applied to capital {}" , start_lending_epoch, current_epoch, amount_to_be_returned);

                    let mut total_amount = dec!(0);
                    let mut first_epoch = Decimal::from(start_lending_epoch);
                    let mut last_value = dec!(0);
                    for (key, value) in interest_for_lendings.range(
                            Decimal::from(start_lending_epoch)..Decimal::from(current_epoch)
                        ) {
                        
                        let internal_length = key-first_epoch;
                        info!("epoch: {}, interest %: {}, length of the period: {}", key, value, internal_length);
                        let accumulated_interest = calculate_interest(Decimal::from(internal_length), value, amount); 
                        total_amount = total_amount + accumulated_interest;
                        info!("Adding accumulated_interest {} for the period, totalling {} from epoch {} until epoch {} ", accumulated_interest, total_amount, first_epoch, key);
                        first_epoch = key;
                        last_value = value; 
                    }
                    //need to add the last run from first_epoch to current epoch
                    let last = current_epoch - first_epoch;
                    let accumulated_interest = calculate_interest(Decimal::from(last), last_value, amount); 
                    total_amount = total_amount + accumulated_interest;
                    info!("Adding accumulated_interest {} for the period, totalling {} from epoch {} until epoch {} ", accumulated_interest, total_amount, first_epoch, current_epoch);
                    
                    total_amount
                }
            }
        }
        Err(()) => {
            println!("Invalid reward string");
            // Handle invalid input here
            dec!(0)
        }
    };
}


//calculate the interest for the epochs at the percentage given with the capital provided
fn calculate_interest(epochs: Decimal, percentage: Decimal, capital: Decimal) -> Decimal {
    // Calculate daily rate
    let daily_rate = percentage / dec!(100) / dec!(105120);

    // Assuming interest is calculated daily
    let compound_factor = (dec!(1) + daily_rate).pow(epochs);
    let interest = capital * (compound_factor.unwrap() - dec!(1));
    let rounded = interest.checked_round(5, RoundingMode::ToNearestMidpointToEven);

    rounded.unwrap()
}
