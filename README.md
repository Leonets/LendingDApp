# LendingDApp
This Lending dApp is a proof of concept written in Scrypto where tokens are natively supported as a core feature of the network and its aim is to better understand the asset oriented design pattern and serve as a It serves as a training ground to improve your knowledge of the Radix full stack


## Interacting with our Lending dApp Machine Locally

First lets start with a fresh clean ledger with `resim reset`

Next we need to create a default account with `resim new-account`

Store the account address in the account environment variable
`export account=<account_address>`

Now we can publish our package, to do this locally run `resim publish .`

Store the returned package address in the package environment variable 
`export package=<package_address>`

Also you need to export this component for locking the transaction's fee
`export component_test=component_sim1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxhkrefh`

At this point we can instantiate our Lending dApp locally 
`resim run rtm/instantiate_lending_dapp.rtm`

That file has been built with the following bash command:
`$ resim call-function ${package} LendingDApp instantiate_lending_dapp 100 LND --manifest rtm/instantiate_lending_dapp.rtm`

The output of the instantiate is the following resources builded:
New Entities: 6
└─ Component: component_sim1cpwu4wc6rg0am8l9prnh2lzqkk6hue6stzqhdx48rzvek2mmm5vp0p
├─ Resource: resource_sim1th0fzfanrvjucld6yr798c52zxcpmcvz9aqmm75t2r9kzzwylqh6q0
├─ Resource: resource_sim1t4tyehgwmxyrm60u07k7j8rt60z790c2k5m4z6qgvjv84wezct6uz9
├─ Resource: resource_sim1ntrx9nqkpvta3qtqt7j88mq36dlug0t0r6w07u8lfnsksm4z7g807r
├─ Resource: resource_sim1t4zcslfcrkkcmg2fnc2t9a7r4ypxn8276s2e2eq20x2sdje3wwpysr
└─ Resource: resource_sim1ngrczk30tngnmgl688tlfzmed4k8m7pnpcr6smf2ujug3ujxst5eml

where the order is the following:
resource1 -> owner_badge
resource2 -> admin_badge
resource3 -> staff_badge
resource4 -> lending_token
resource5 -> lnd_manager

Store the returned component addres in the component environment variable 
`export component=<component_address>`

Run `resim show $account` and find the admin badge resource address and store it in the admin_badge environment variable `export admin_badge=<resource_address>` and the owner_badge environment variable 
`export owner_badge=<resource_address>`

Export also the lnd_manager in the environment variable 
`export lnd_manager=<lnd_resource_address>`

Export also the lending_token resource address in the environment variable 
`export lending_token=<lending_token>`
That is the resource with the symbol you created the dApp (LendingToken, A token to use to receive back the loan)


Let's also set the xrd address as an environment variable 
`export xrd=resource_sim1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxakj8n3`

You can also run the lend_tokens.rtm transaction manifest to takes back the XRD loan `resim run rtm/lend_tokens.rtm`

That file has been built with the following bash command:
`resim call-method ${component} lend_tokens $xrd:100  --manifest rtm/lend_tokens.rtm`


You can also run the takes_back.rtm transaction manifest to takes back the XRD loan `resim run rtm/takes_back.rtm`

That file has been built with the following bash command:
`resim call-method ${component} takes_back $lnd:10 $lnd_manager:1 --manifest rtm/takes_back.rtm`


To fund the main vault and to fund the development you can run 
`resim run rtm/fund.rtm` to fund 100xrd each time.

At the end, if you don't want anymore to fund nor to lend then you can unregister by using 
`resim run rtm/unregister.rtm`

# Administration 

As the holder of the owner badge you can run `resim run rtm/withdraw_earnings.rtm` to collect your riches.
`resim call-method ${component} withdraw_earnings --manifest rtm/withdraw_earnings.rtm`

As the holder of the admin or owner badge you can run `resim run rtm/set_reward.rtm` to set the reward for lenders.
`resim call-method ${component} set_reward 10 --manifest rtm/set_reward.rtm`

As the holder of the admin or owner badge you can run `resim run rtm/mint_staff_badge.rtm` to mint a badge for new staff.
`resim call-method ${component} mint_staff_badge luigi --manifest rtm/mint_staff_badge.rtm`

As the holder of the admin,owner or staff badge you can run `resim run rtm/extend_lending_pool.rtm` to extend the pool for lenders.
`resim call-method ${component} extend_lending_pool 100 --manifest rtm/extend_lending_pool.rtm`

# Quick test

You can run ./lending_dapp.sh

# Unit test

You can run 'scrypto test' from the 'scrypto' directory for testing the main functions (lend and takes_back)


# TODO & Useful commands

//to update the package without resetting resim 

resim publish . --package-address $package