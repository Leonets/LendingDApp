set -e

export xrd=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3

echo "Resetting environment"
resim reset
export account=$(resim new-account | sed -nr "s/Account component address: ([[:alnum:]_]+)/\1/p")
echo "Account = " $account
echo "XRD = " $xrd

echo "Publishing dapp"
export dapp_package=$(resim publish . | sed -nr "s/Success! New Package: ([[:alnum:]_]+)/\1/p")
echo "Package = " $dapp_package

output=`resim call-function $dapp_package ZeroCollateral instantiate 5 10 LND 1728 timebased 1000 | awk '/Component: |Resource: / {print $NF}'`
export component=`echo $output | cut -d " " -f1`
export owner_badge=`echo $output | cut -d " " -f2`
export admin_badge=`echo $output | cut -d " " -f3`
export staff_badge=`echo $output | cut -d " " -f4`
export bad_payer=`echo $output | cut -d " " -f5`
export zerounit_token=`echo $output | cut -d " " -f6`
export userdata_nft_manager=`echo $output | cut -d " " -f7`
export creditscore_nft_manager=`echo $output | cut -d " " -f8`
export pt=`echo $output | cut -d " " -f9`
export yt=`echo $output | cut -d " " -f10`

export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh

echo 'component = '$component
echo 'owner_badge = '$owner_badge
echo 'admin_badge = '$admin_badge
echo 'staff_badge = '$staff_badge
echo 'zerounit_token = ' $zerounit_token
echo 'userdata_nft_manager = ' $userdata_nft_manager
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

# echo '>>> Donate'

# resim run rtm/fund.rtm
# resim run rtm/fund.rtm
# donations 200

echo '>>> Register'

resim run rtm/register.rtm

resim show $account



echo '>>> Set Interest'
resim set-current-epoch 0

echo '>>> Borrow'
resim set-current-epoch 10
export amount='100'
export length='500'
resim run rtm/borrow.rtm
# fee 10

resim show $account


resim set-current-epoch 300
echo '>>> Someone is late ?'
resim run rtm/asking_repay.rtm

resim set-current-epoch 600
echo '>>> Now someone should be late '
resim run rtm/asking_repay.rtm

echo '>>> Mint Some BadPayer'
resim run rtm/mint_bad_payer.rtm

echo '>>> Simulate Send BadPayer'
# To simulate the send... it needs another account here in this script
# resim run rtm/send_bad_payer.rtm

echo '>>> Repay'

resim run rtm/repay_badpayer.rtm
# fee 10
# main pool 5

echo '>>> Check again how are the list late_payers and redeemed late payers'
resim run rtm/asking_repay.rtm


resim show $account






