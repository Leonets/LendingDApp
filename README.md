# LendingDApp
This Lending dApp is a proof of concept written in Scrypto where tokens are natively supported as a core feature of the network and its aim is to better understand the asset oriented design pattern and serve as a It serves as a training ground to improve your knowledge of the Radix full stack



## Interacting with our Lending dApp Machine Locally
First lets start with a fresh clean ledger with `resim reset`

Next we need to create a default account with `resim new-account`

Store the account address in the account environment variable
`export account=<account_address>`

Now we can publish our package, to do this locally run `resim publish .`

Store the returned package address in the package environment variable `export package=<package_address>`

At this point we can instantiate our Lending dApp locally `resim run rtm/instantiate_lending_dapp.rtm`

That file has been built with the following bash command:
`$ resim call-function ${package} LendingDApp instantiate_lending_dapp 100 LND --manifest rtm/instantiate_lending_dapp.rtm`

Store the returned component addres in the component environment variable `export component=<component_address>`

Run `resim show $account` and find the admin badge resource address and store it in the admin_badge environment variable `export admin_badge=<resource_address>` and the owner_badge environment variable `export owner_badge=<resource_address>`

Export also the lnd_resource_manager in the environment variable `export lnd_resource_manager=<lnd_resource_address>`

Export also the lending_token resource address in the environment variable `export lending_token=<lending_token>`
That is the resource with the symbol you created the dApp (LendingToken, A token to use to receive back the loan)


Let's also set the xrd address as an environment variable `export xrd=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3`

You can also run the lend_tokens.rtm transaction manifest to takes back the XRD loan `resim run rtm/lend_tokens.rtm`

That file has been built with the following bash command:
`resim call-method ${component} lend_tokens $xrd:100  --manifest rtm/lend_tokens.rtm`

You can also run the take_back.rtm transaction manifest to takes back the XRD loan `resim run rtm/take_back.rtm`

That file has been built with the following bash command:
`resim call-method ${component} take_back $lending_token:10  --manifest rtm/take_back.rtm`

==============================
You can also run the takes_back.rtm transaction manifest to takes back the XRD loan `resim run rtm/takes_back.rtm`

That file has been built with the following bash command:
`resim call-method ${component} takes_back resource_sim1t4zcslfcrkkcmg2fnc2t9a7r4ypxn8276s2e2eq20x2sdje3wwpysr:100 resource_sim1ngrczk30tngnmgl688tlfzmed4k8m7pnpcr6smf2ujug3ujxst5eml:1 --manifest rtm/takes_back.rtm`







As the holder of the admin badge you can run `resim run withdraw_earnings.rtm` to collect your riches.


# TODO & Useful commands

//to update the package without resetting resim 
resim publish . --package-address $package