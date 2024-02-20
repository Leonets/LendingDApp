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
`$ resim call-function ${package} LendingDApp instantiate_lending_dapp 5 10 LND 1728 timebased 1000 --manifest rtm/instantiate_lending_dapp.rtm`

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
resource4 -> benefactor_badge
resource5 -> lending_token
resource6 -> lnd_manager
resource7 -> bad_payer

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

You can run:
    - ./lending_dapp.sh for testing some of the main function
    - ./interest.sh for testing some function about calculations over passive interest
    - ./reward.sh for testing some function about calculations over active interest
    - ./recall.sh for testing nft recalling
    - ./flash_loan.sh for testing a demo of a flash loan

# Unit test

You can run 'scrypto test' from the 'scrypto' directory for testing the main functions (lend and takes_back)

# Package building

You can run 'scrypto build' from the 'scrypto' directory for building the packages for deploy

# Application automation (some of this have been moved to the repo 'LendingDappProcesses)

Some shortcut are available for testing, deploying and managing the dApp

You can run (typescrypt):
     - 'npm run' to look for all the available command
     - 'npm run lending:deploy-lendingdapp' to deploy the package to stokenet
     - 'npm run lending:extend_lending_pool' to extend the lending pool

You can run (typescrypt) from the 'Processes' repo:
     - 'npm run lending:asking_repay' to ask borrowers for repay if the expected epoch has been exceeded
     - 'npm run lending:send_bad_payer_nft': to send to late borrowers the BadPayer NFT
     - 'npm run lending:recall_bad_payer_nft': tp recall the BadPayer NFT from the borrowers that have repaid the loan

You can run (terraform):
    - run 'npm run build' in the 'client' directory of the Frontend application to have the website compiled
    - export.sh in the Frontend application for updating the remote website
    
# Local Application

To local test the whole application you can:
    - deploy the package
    - extract the component and resource addresses
    - save those value in .env in the Frontend application
    - run 'npm run dev' in the 'client' directory of the Frontend application
    - a website will be available at localhost:5173 for local testing with a remote stokenet deployed smart contract

# Application Architecture (TODO)

Let's describe which is the architecture of the whole dApp

    - Vaults: 4 vaults are managed by the contract
    - Data: Some vectors and trees are managed by the contract 
    - Processes:
    - Metadata: 


# TODO & Useful commands

//to update the package without resetting resim 

resim publish . --package-address $package

# Managing Smart Contract Upgrade
At the moment of this writing there is no upgradability in the smart contract so until this gets deployed in the mainnet each new smart contract overrides the preceding one, this are the operation needed in the e layers:

- Scrypto layer (repo 'LendingDApp')
    - execute bash script for testing and 'scrypto test'
    - deploy the smart contract: 'npm run lending:deploy-lendingdapp'
    - use the return 'tx-id' for looking up in the dashboard all the component and resources created
    - fill the new values in the .env file (this are needed for executing the 'npm run')
    - execute 'node replaceValues.js' to have the files 'claimed_entities.rtm' and 'claimed_website.rtm' ready in directory scrypto/dapp_definition/
    - executes the two transactions with the dashboard

- Frontend layer (repo 'LendingDApp-Frontend')
    - fill the new values in the .env* file (this are needed for Javascript/Typescript inside the website)
    - fill the dApp id (if changed) inside /client/public/.well-known/radix.json
    - executes the export of the dApp website (/deploy/export.sh)

- Processes layer (repo 'LendingDApp-Processes')
    - fill the new values in the .env* file (this are needed for executing the 'npm run')
    - manually send .env to the server (it is not managed with Terraform)
    - executes the export (if changed) of the dApp process (/deploy/export.sh)


# Managing Smart Contract QUICK Upgrade 

- Scrypto layer (repo 'LendingDApp')
    - deploy the smart contract: 'npm run lending:deploy-lendingdapp' (this will fill the file entities.properties with new component addresses)
    - execute 'node replaceValues.js' to have the files 'claimed_entities.rtm' and 'claimed_website.rtm' ready in directory scrypto/dapp_definition/
    - executes the two transactions with the dashboard

- Frontend layer (repo 'LendingDApp-Frontend')
    - fill the new values in the .env* file (no seed phrase present)
    - executes the export of the dApp website (/deploy/export.sh)

- Processes layer (repo 'LendingDApp-Processes')
    - fill the new values in the .env* file (seed phrase present!!)
    - [MANUALLY] send .env to the server (it is not managed with Terraform)
    - [OPT] executes the export if any of the dApp process have been changed (/deploy/export.sh)

