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
export staff_badge=`echo $output | cut -d " " -f4`
export benefactor_badge=`echo $output | cut -d " " -f5`
export bad_payer=`echo $output | cut -d " " -f6`
export lending_token=`echo $output | cut -d " " -f7`
export lnd_manager=`echo $output | cut -d " " -f8`
export pt=`echo $output | cut -d " " -f9`
export yt=`echo $output | cut -d " " -f10`


export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh

echo 'component = '$component
echo 'owner_badge = '$owner_badge
echo 'admin_badge = '$admin_badge
echo 'staff_badge = '$staff_badge
echo 'lending_token = ' $lending_token
echo 'lnd_manager = ' $lnd_manager
echo 'benefactor_badge = ' $benefactor_badge

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

# echo '>>> Donate'

# resim run rtm/fund.rtm
# resim run rtm/fund.rtm
# donations 200

echo '>>> Register'

resim run rtm/register.rtm

resim show $account

echo '>>> Lend tokens'

resim set-current-epoch 1
#resim call-method ${component} lend_tokens $xrd:100
resim run rtm/lend_tokens.rtm

#enable this to test the unregister function
#resim run rtm/unregister.rtm

resim show $account

echo '>>> Takes back'

# 1 epoch = 5min
# 12 epoch = 1h
# 264 epoch = 1d
# 7920 epoch = 1month
# 96.360 epoch = 1year

resim set-current-epoch 96360
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

echo '>>> Borrow'

resim run rtm/borrow.rtm
# fee 10

resim show $account

echo '>>> Repay'

resim run rtm/repay.rtm
# fee 10
# main pool 5

resim show $account

echo '>>> Borrow Again'

resim run rtm/borrow.rtm
# fee 10
# main pool -100

# echo '>>> Lend tokens again before next available epoch slot'
# resim run rtm/lend_tokens.rtm

echo '>>> Set Reward'

resim run rtm/set_reward.rtm

echo '>>> Set Period Length Pool'

resim run rtm/set_period_length.rtm

echo '>>> Extend Lending Pool'

resim run rtm/extend_lending_pool.rtm

echo '>>> Mint Staff Badge'

resim run rtm/mint_staff_badge.rtm

echo '>>> Withdraw Fees'

resim run rtm/withdraw_fees.rtm

echo '>>> Withdraw Earnings'
# fee -20

# resim run rtm/withdraw_earnings.rtm
# donations -20

echo '>>> Pools'

resim run rtm/pools.rtm

# fee vault -> 30
# donations vault -> 180
# main pool -> 100

# echo '>>> Init BadPayer Vault'

# resim run rtm/init_badpayer.rtm