import { RadixDappToolkit, DataRequestBuilder, RadixNetwork } from '@radixdlt/radix-dapp-toolkit'
// You can create a dApp definition in the dev console at https://stokenet-console.radixdlt.com/dapp-metadata 
// then use that account for your dAppId
// Set an environment variable to indicate the current environment
const environment = process.env.NODE_ENV || 'Stokenet'; // Default to 'development' if NODE_ENV is not set
console.log("environment : ", environment)
// Define constants based on the environment
let dAppId, networkId;

if (environment === 'Mainnet') {
  dAppId = 'account_tdx_2_12y0nsx9';
  networkId = RadixNetwork.Mainnet;
} else {
  // Default to Stokenet configuration
  dAppId = 'account_tdx_2_12y0nsx972ueel0args3jnapz9qtexyj9vpfqtgh3th4v8z04zht7jl';
  networkId = RadixNetwork.Stokenet;
}

// Instantiate DappToolkit
const rdt = RadixDappToolkit({
  dAppDefinitionAddress: dAppId,
  networkId: networkId,
  applicationName: 'Lending dApp',
  applicationVersion: '1.0.0',
});
console.log("dApp Toolkit: ", rdt)

let accountAddress
let accountName
let inputValue

// ************ Fetch the user's account address ************
rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))
// Subscribe to updates to the user's shared wallet data
rdt.walletApi.walletData$.subscribe((walletData) => {
  console.log("subscription wallet data: ", walletData)
  document.getElementById('accountName').innerText = walletData.accounts[0].label
  document.getElementById('accountAddress').innerText = walletData.accounts[0].address
  accountName = walletData.accounts[0].label
  accountAddress = walletData.accounts[0].address
})

// Package address v.5
// package_tdx_2_1phwmc8ytpjtjfezqpq057gzq50gwzj23qt4vqaveea8hml4prg6z2n
// dalla tx = txid_tdx_2_1sf03yjvswnvzkt7ws9ltjjmz3a54vh2pyg5kw2q3zf3v3hxyl99sfcch9f
// CREATED ENTITIES = 
// component_tdx_2_1cpvjha5pl0z74g8ll0329gvcypvhsytq75g8agemw0dnj7s3e0gn4licon
// resource_tdx_2_1thlpe0pl24ay7tzvgmv04lc0eu04sn5n6ve6qqujf28xnfdqn9n98vicon
// resource_tdx_2_1tkhlzmlsgpkljl9cdr2d65t9k9hpu9xytegdjyfg78mdpfepjush22icon
// resource_tdx_2_1n2hcf9cu0m2jpp23tzy8p03l3xdt26cqqm58qxcsdvee0ynsmhlpfeicon
// resource_tdx_2_1ngd26wz3mew2d7n0wf4a8f788tltqk465cw9fuwtnwh6g8a3hc57e2icon
// resource_tdx_2_1t4ew27eswmeu0m9f9dhun3fvzhusd4hma6u8mmfg6e4zeqywcmyf5yicon
// resource_tdx_2_1ngkem9png0mtqk4fp7e3eg5ayxlf6adt59ckxv6xv8j0gqur9dan58


// Component Address: component_tdx_2_1cpvjha5pl0z74g8ll0329gvcypvhsytq75g8agemw0dnj7s3e0gn4l
// admin_badge address: resource_tdx_2_1tkhlzmlsgpkljl9cdr2d65t9k9hpu9xytegdjyfg78mdpfepjush22
// owner_badge address: resource_tdx_2_1thlpe0pl24ay7tzvgmv04lc0eu04sn5n6ve6qqujf28xnfdqn9n98v
// benefactor_badge: resource_tdx_2_1ngd26wz3mew2d7n0wf4a8f788tltqk465cw9fuwtnwh6g8a3hc57e2
// lnd_resource address: resource_tdx_2_1ngkem9png0mtqk4fp7e3eg5ayxlf6adt59ckxv6xv8j0gqur9dan58
// lnd_token address: resource_tdx_2_1t4ew27eswmeu0m9f9dhun3fvzhusd4hma6u8mmfg6e4zeqywcmyf5y

// Global states
let componentAddress = "component_tdx_2_1cpvjha5pl0z74g8ll0329gvcypvhsytq75g8agemw0dnj7s3e0gn4l" //LendingDApp component address on stokenet
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1tkhlzmlsgpkljl9cdr2d65t9k9hpu9xytegdjyfg78mdpfepjush22"
let owner_badge = "resource_tdx_2_1thlpe0pl24ay7tzvgmv04lc0eu04sn5n6ve6qqujf28xnfdqn9n98v"
let lnd_resourceAddress = "resource_tdx_2_1ngkem9png0mtqk4fp7e3eg5ayxlf6adt59ckxv6xv8j0gqur9dan58" // XRD lender badge manager
let lnd_tokenAddress = "resource_tdx_2_1t4ew27eswmeu0m9f9dhun3fvzhusd4hma6u8mmfg6e4zeqywcmyf5y" // LND token resource address

let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address

// ************ Instantiate component and fetch component and resource addresses *************
document.getElementById('instantiateComponent').onclick = async function () {
  let packageAddress = document.getElementById("packageAddress").value;
  let flavor = document.getElementById("flavor").value;
  let manifest = `
  CALL_FUNCTION
    Address("${packageAddress}")
    "LendingDApp"
    "instantiate_lending_dapp"
    Decimal("5")
    "${flavor}"
    Decimal("1728");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
    `
  console.log("Instantiate Manifest: ", manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  console.log("Intantiate WalletSDK Result: ", result.value)


  // ************ Fetch the transaction status from the Gateway API ************
  let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  console.log('Instantiate TransactionApi transaction/status:', transactionStatus)


  // ************ Fetch component address from gateway api and set componentAddress variable **************
  let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  console.log('Instantiate getCommittedDetails:', getCommitReceipt)

  // ****** Set componentAddress variable with gateway api getCommitReciept payload ******
  componentAddress = getCommitReceipt.transaction.affected_global_entities[2];
  document.getElementById('componentAddress').innerText = componentAddress;

  const componentAddressElement = document.getElementById('componentAddress');

  if (componentAddressElement) {
    // The element with ID 'componentAddress' exists, set its text content
    componentAddress = getCommitReceipt.transaction.affected_global_entities[2];
    componentAddressElement.innerText = componentAddress;
  } else {
    // Handle the case where the element doesn't exist or is not available
    console.log("Element with ID 'componentAddress' not found.");
  }

  // ****** Set admin_badge variable with gateway api getCommitReciept payload ******
  admin_badge = getCommitReceipt.transaction.affected_global_entities[4];
  document.getElementById('admin_badge').innerText = admin_badge;

  // ****** Set owner_badge variable with gateway api getCommitReciept payload ******
  owner_badge = getCommitReceipt.transaction.affected_global_entities[3];
  document.getElementById('owner_badge').innerText = owner_badge;

  // ****** Set lnd_resourceAddress variable with gateway api getCommitReciept payload ******
  lnd_resourceAddress = getCommitReceipt.transaction.affected_global_entities[7];
  document.getElementById('lnd_resourceAddress').innerText = lnd_resourceAddress;

  // ****** Set lnd_tokenAddress variable with gateway api getCommitReciept payload ******
  lnd_tokenAddress = getCommitReceipt.transaction.affected_global_entities[6];
  document.getElementById('lnd_tokenAddress').innerText = lnd_tokenAddress;
}
