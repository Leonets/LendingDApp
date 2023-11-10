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

output=`resim call-function $lendingapp_package LendingDApp instantiate_lending_dapp 5 LND | awk '/Component: |Resource: / {print $NF}'`
export component=`echo $output | cut -d " " -f1`
export owner_badge=`echo $output | cut -d " " -f2`
export admin_badge=`echo $output | cut -d " " -f3`
export staff_badge=`echo $output | cut -d " " -f4`
export lending_token=`echo $output | cut -d " " -f5`
export lnd_manager=`echo $output | cut -d " " -f6`

export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh

echo 'component = '$component
echo 'owner_badge = '$owner_badge
echo 'admin_badge = '$admin_badge
echo 'staff_badge = '$staff_badge
echo 'lending_token = ' $lending_token
echo 'lnd_manager = ' $lnd_manager

echo ' '
echo 'account = ' $account
echo 'xrd = ' $xrd
echo 'test faucet for lock fee = ' $component_test
echo ' '

echo '>>> Fund Main Vault'

resim run rtm/fund.rtm
resim run rtm/fund.rtm

echo '>>> Register'

resim run rtm/register.rtm

resim show $account

echo '>>> Lend tokens'

#resim call-method ${component} lend_tokens $xrd:100
resim run rtm/lend_tokens.rtm

resim show $account

echo '>>> Takes back'

#resim call-method ${component} takes_back $lending_token:100
resim run rtm/takes_back.rtm

resim show $account

echo '>>> Takes back remaining'

resim run rtm/takes_back_20.rtm

resim show $account

