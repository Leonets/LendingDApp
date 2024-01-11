set -e

export xrd=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3

echo "Resetting environment"
resim reset
export account=$(resim new-account | sed -nr "s/Account component address: ([[:alnum:]_]+)/\1/p")
echo "Account = " $account
echo "XRD = " $xrd

echo "Publishing dapp"
export lendingapp_package=$(resim publish . | sed -nr "s/Success! New Package: ([[:alnum:]_]+)/\1/p")
echo "Package = " $lendingapp_package

output=`resim call-function $lendingapp_package LendingDApp instantiate_lending_dapp 5 10 LND 1728 timebased 1000 | awk '/Component: |Resource: / {print $NF}'`
export component=`echo $output | cut -d " " -f1`
export owner_badge=`echo $output | cut -d " " -f2`
export admin_badge=`echo $output | cut -d " " -f3`
export benefactor_badge=`echo $output | cut -d " " -f4`
export bad_payer=`echo $output | cut -d " " -f5`
export staff_badge=`echo $output | cut -d " " -f6`
export lending_token=`echo $output | cut -d " " -f7`
export lnd_manager=`echo $output | cut -d " " -f8`



export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh

echo 'component = '$component
echo 'owner_badge = '$owner_badge
echo 'admin_badge = '$admin_badge
echo 'staff_badge = '$staff_badge
echo 'lending_token = ' $lending_token
echo 'lnd_manager = ' $lnd_manager
echo 'benefactor_badge = ' $benefactor_badge
echo 'bad_payer = ' $bad_payer

echo ' '
echo 'account = ' $account
echo 'xrd = ' $xrd
echo 'test faucet for lock fee = ' $component_test
echo ' '

echo '>>> Fund Main Vault'

resim run rtm/fund_main_pool.rtm
resim run rtm/fund_main_pool.rtm
# main pool 200
resim run rtm/fund_main_pool_4000.rtm
# main pool 4200

echo '>>> Donate'

resim run rtm/fund.rtm
resim run rtm/fund.rtm
# donations 200

echo '>>> Register'

resim run rtm/register.rtm

resim show $account

echo '>>> Lend tokens'

resim set-current-epoch 1
#resim call-method ${component} lend_tokens $xrd:100
resim run rtm/lend_tokens.rtm

resim show $account

echo '>>> Set Reward 4 at epoch 100'
resim set-current-epoch 100
resim run rtm/set_reward_4.rtm

echo '>>> Set Reward 8 at epoch 200'
resim set-current-epoch 200
resim run rtm/set_reward_8.rtm

echo '>>> Set Reward 12 at epoch 300'
resim set-current-epoch 300
resim run rtm/set_reward_12.rtm

# echo '>>> Show Reward Values along epochs'
# resim run rtm/lend_reward.rtm

resim set-current-epoch 400

echo '>>> Takes back'

# 1 epoch = 5min
# 12 epoch = 1h
# 264 epoch = 1d
# 7920 epoch = 1month
# 96.360 epoch = 1year

# resim set-current-epoch 96360
#resim call-method ${component} takes_back $lending_token:100
resim run rtm/takes_back.rtm
# fee 10

resim show $account

echo '>>> lending_token'
resim show $lending_token
echo '>>> lnd_manager'
resim show $lnd_manager

echo '>>> Takes back remaining'

resim run rtm/takes_back_20.rtm
# fee 10 
# main pool -5

resim show $component


echo '>>> Set Interest'
resim set-current-epoch 0

echo '>>> Borrow'

resim run rtm/borrow.rtm
# fee 10

resim show $account

echo '>>> Set Interest 5 at epoch 100'
resim set-current-epoch 100
resim run rtm/set_interest_5.rtm


echo '>>> Set Interest 15 at epoch 200'
resim set-current-epoch 200
resim run rtm/set_interest_15.rtm

echo '>>> Set Interest 10 at epoch 300'
resim set-current-epoch 300
resim run rtm/set_interest.rtm

# echo '>>> Show Interest Values along epochs'
# resim run rtm/borrow_interest.rtm


resim set-current-epoch 400
echo '>>> Someone is late ?'
resim run rtm/asking_repay.rtm

resim set-current-epoch 1701
echo '>>> Now someone should be late '
resim run rtm/asking_repay.rtm

echo '>>> Repay'

resim run rtm/repay.rtm
# fee 10
# main pool 5

echo '>>> Check again how are the list late_payers and redeemed late payers'
resim run rtm/asking_repay.rtm


resim show $account






