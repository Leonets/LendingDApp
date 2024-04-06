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

output=`resim call-function $lendingapp_package ZeroCollateral instantiate_lending_dapp 5 10 LND 1728 timebased 1000 | awk '/Component: |Resource: / {print $NF}'`
export component=`echo $output | cut -d " " -f1`
export owner_badge=`echo $output | cut -d " " -f2`
export admin_badge=`echo $output | cut -d " " -f3`
export staff_badge=`echo $output | cut -d " " -f4`
export bad_payer=`echo $output | cut -d " " -f5`
export zerounit_token=`echo $output | cut -d " " -f6`
export userdata_nft_manager=`echo $output | cut -d " " -f7`
export credit_score=`echo $output | cut -d " " -f8`
export pt=`echo $output | cut -d " " -f9`
export yt=`echo $output | cut -d " " -f10`


export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh

echo 'output = '$output

echo 'component = '$component
echo 'owner_badge = '$owner_badge
echo 'admin_badge = '$admin_badge
echo 'staff_badge = '$staff_badge
echo 'zerounit_token = ' $zerounit_token
echo 'userdata_nft_manager = ' $userdata_nft_manager
echo 'bad_payer = ' $bad_payer

echo ' '
echo 'account = ' $account
echo 'xrd = ' $xrd
echo 'test faucet for lock fee = ' $component_test
echo ' '

resim show $account

echo ' > owner'
resim show $owner_badge
echo ' > admin'
resim show $admin_badge
echo ' > staff'
resim show $staff_badge
echo ' > bad'
resim show $bad_payer
echo ' > lnd'
resim show $userdata_nft_manager
echo ' > zero unit'
resim show $zerounit_token
echo ' > pt'
resim show $pt
echo ' > yt'
resim show $yt

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

# echo '>>> Register'

# resim run rtm/register.rtm

echo '>>> Register'

resim run rtm/register_new.rtm

echo '>>> Register Again'

resim run rtm/register_again.rtm

resim show $account

echo '>>> Lend tokens'

resim set-current-epoch 1
#resim call-method ${component} lend_tokens $xrd:100
resim run rtm/lend_tokens.rtm


echo '>>> Tokenize 1 @100'

resim set-current-epoch 100
#resim call-method ${component} tokenize_yield $xrd:100
resim run rtm/tokenize_yield.rtm

resim show $account

echo '>>> Tokenize 2 @150'

resim set-current-epoch 150
#resim call-method ${component} tokenize_yield $xrd:100
resim run rtm/tokenize_yield.rtm

resim show $account

# echo '>>> Redeem'

# resim set-current-epoch 200
# #resim call-method ${component} tokenize_yield $xrd:100
# resim run rtm/redeem.rtm

# resim show $account

echo '>>> redeem_from_pt (After Maturity)'

resim set-current-epoch 450
#resim call-method ${component} tokenize_yield $xrd:100
resim run rtm/redeem_from_pt.rtm

resim show $account

echo '>>> Claim Yield (After Maturity)'

resim set-current-epoch 500
#resim call-method ${component} tokenize_yield $xrd:100
resim run rtm/claim_yield.rtm

resim show $account

echo '>>> redeem_from_pt, trying again (After Maturity 2)'

resim set-current-epoch 550
#resim call-method ${component} tokenize_yield $xrd:100
resim run rtm/redeem_from_pt.rtm

resim show $account

echo '>>> redeem_from_pt, trying again (After Maturity 3)'

resim set-current-epoch 550
#resim call-method ${component} tokenize_yield $xrd:100
resim run rtm/redeem_from_pt.rtm

resim show $account



