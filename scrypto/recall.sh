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
export lending_token=`echo $output | cut -d " " -f6`
export lnd_manager=`echo $output | cut -d " " -f7`


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

echo '>>> Donate'

resim run rtm/fund.rtm
resim run rtm/fund.rtm
# donations 200

echo '>>> Register'

resim run rtm/register.rtm

echo '>>> Mint Staff'

resim run rtm/mint_staff_badge.rtm

echo '>>> Staff Badge Info'
resim show $staff_badge

echo '>>> Owner Account with all the resources'
resim show $account

echo '>>> Recall Staff'
resim run rtm/recall_staff_badge.rtm

echo '>>> Staff Badge Info After recall'
resim show $staff_badge

echo '>>> Owner Account After recall with all the resources'
resim show $account






