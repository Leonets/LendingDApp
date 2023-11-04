import { RadixDappToolkit, DataRequestBuilder, RadixNetwork } from '@radixdlt/radix-dapp-toolkit'
// You can create a dApp definition in the dev console at https://stokenet-console.radixdlt.com/dapp-metadata 
// then use that account for your dAppId
const dAppId = 'account_tdx_2_12ys5dcytt0hc0yhq5a78stl7upchljsvs36ujdunlszlrgu90mz44d'
// Instantiate DappToolkit
const rdt = RadixDappToolkit({
  dAppDefinitionAddress: dAppId,
  networkId: RadixNetwork.Stokenet, // network ID 2 is for the stokenet test network 1 is for mainnet
  applicationName: 'Lending dApp',
  applicationVersion: '1.0.0',
})
console.log("dApp Toolkit: ", rdt)

// ************ Fetch the user's account address ************
rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))
// Subscribe to updates to the user's shared wallet data
rdt.walletApi.walletData$.subscribe((walletData) => {
  console.log("subscription wallet data: ", walletData)
  document.getElementById('accountName').innerText = walletData.accounts[0].label
  document.getElementById('accountAddress').innerText = walletData.accounts[0].address
  accountAddress = walletData.accounts[0].address
})

// Component Address: component_tdx_2_1cp8augrku3n8qtymn2sp7ftrg88j7z87lvdjv5j7ahnryqaed4zkn6
// admin_badge address: resource_tdx_2_1t4c90u0tlr3mk5kaylz9zvsxxe4h7se6hhh83rx5lyxe3xnlfxfeyf
// owner_badge address: resource_tdx_2_1thkd8742jed4wgngeu6u9eets8cyv04na9laxzv95ktahac8efx8ev
// lnd_resource address: resource_tdx_2_1thm5a8chndanjkh20qw5nrfg782f9annfzudjj653f8kyj94w6zcpg

// Global states
let accountAddress // User account address
let componentAddress = "component_tdx_2_1cp8augrku3n8qtymn2sp7ftrg88j7z87lvdjv5j7ahnryqaed4zkn6" //LendingDApp component address on stokenet
let lnd_resourceAddress = "resource_tdx_2_1thm5a8chndanjkh20qw5nrfg782f9annfzudjj653f8kyj94w6zcpg" // Stokenet BABYLON resource address
let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1t4c90u0tlr3mk5kaylz9zvsxxe4h7se6hhh83rx5lyxe3xnlfxfeyf"
let owner_badge = "resource_tdx_2_1thkd8742jed4wgngeu6u9eets8cyv04na9laxzv95ktahac8efx8ev"
// You can use this address to skip package deployment step
// Stokenet package_address = package_tdx_2_1p4ccyz5jtgg0ptgddex03vn068uaz937zucky3nyp9hd6nml4ypx9a


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
    "${flavor}";
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
  lnd_resourceAddress = getCommitReceipt.transaction.affected_global_entities[6];
  document.getElementById('lnd_resourceAddress').innerText = lnd_resourceAddress;

  // ****** Set lnd_resourceAddress variable with gateway api getCommitReciept payload ******
  lnd_tokenAddress = getCommitReceipt.transaction.affected_global_entities[5];
  document.getElementById('lnd_tokenAddress').innerText = lnd_tokenAddress;

  // ****** Set badge_resourceAddress variable with gateway api getCommitReciept payload ******
  lnd_tokenAddress = getCommitReceipt.transaction.affected_global_entities[7];
  document.getElementById('badge_resourceAddress').innerText = lnd_tokenAddress;
}



