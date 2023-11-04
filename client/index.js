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

let accountAddress
let accountName

// ************ Fetch the user's account address ************
rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))
// Subscribe to updates to the user's shared wallet data
rdt.walletApi.walletData$.subscribe((walletData) => {
  console.log("subscription wallet data: ", walletData)
  // document.getElementById('accountName').innerText = walletData.accounts[0].label
  // document.getElementById('accountAddress').innerText = walletData.accounts[0].address
  accountName = walletData.accounts[0].label
  accountAddress = walletData.accounts[0].address
})

// Component Address: component_tdx_2_1cp8augrku3n8qtymn2sp7ftrg88j7z87lvdjv5j7ahnryqaed4zkn6
// admin_badge address: resource_tdx_2_1t4c90u0tlr3mk5kaylz9zvsxxe4h7se6hhh83rx5lyxe3xnlfxfeyf
// owner_badge address: resource_tdx_2_1thkd8742jed4wgngeu6u9eets8cyv04na9laxzv95ktahac8efx8ev
// lnd_resource address: resource_tdx_2_1thm5a8chndanjkh20qw5nrfg782f9annfzudjj653f8kyj94w6zcpg

// Global states
let componentAddress = "component_tdx_2_1cp8augrku3n8qtymn2sp7ftrg88j7z87lvdjv5j7ahnryqaed4zkn6" //LendingDApp component address on stokenet
let lnd_resourceAddress = "resource_tdx_2_1thm5a8chndanjkh20qw5nrfg782f9annfzudjj653f8kyj94w6zcpg" // Stokenet BABYLON resource address
let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1t4c90u0tlr3mk5kaylz9zvsxxe4h7se6hhh83rx5lyxe3xnlfxfeyf"
let owner_badge = "resource_tdx_2_1thkd8742jed4wgngeu6u9eets8cyv04na9laxzv95ktahac8efx8ev"
// You can use this address to skip package deployment step
// Stokenet package_address = package_tdx_2_1p4ccyz5jtgg0ptgddex03vn068uaz937zucky3nyp9hd6nml4ypx9a



// *********** Lends Token ***********
document.getElementById('lendTokens').onclick = async function () {
  console.log("componentAddress", componentAddress)
  console.log("lnd_resourceAddress", lnd_resourceAddress)
  console.log("admin_badge", admin_badge)
  console.log("owner_badge", owner_badge)

  console.log("accountName", accountAddress)
  console.log("accountAddress", accountAddress)

  let numberOfToken = document.getElementById('numberOfTokens').value
  let manifest = `
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${xrdAddress}")
    Decimal("${numberOfToken}");
  TAKE_ALL_FROM_WORKTOP
    Address("${xrdAddress}")
    Bucket("xrd");
  CALL_METHOD
    Address("${componentAddress}")
    "lend_tokens"
    Bucket("xrd");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
    `
  console.log("Lend Tokens manifest", manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  console.log("Lend Tokens sendTransaction result: ", result.value)

  // Fetch the transaction status from the Gateway SDK
  let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  console.log('Lend Tokens transaction status', transactionStatus)

  // fetch commit reciept from gateway api 
  let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  console.log('Lend Tokens Committed Details Receipt', getCommitReceipt)

  // Show the receipt in the DOM
  // document.getElementById('receiptLends').innerText = JSON.stringify(getCommitReceipt);
}



// *********** Take Back ***********
document.getElementById('take_back').onclick = async function () {
  let numberOfLndToken = document.getElementById('numberOfLndToken').value
  let manifest = `
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${lnd_resourceAddress}")
    Decimal("${numberOfLndToken}");
  TAKE_FROM_WORKTOP
    Address("${lnd_resourceAddress}")
    Decimal("${numberOfLndToken}")
    Bucket("loan");
  CALL_METHOD
    Address("${componentAddress}")
    "take_back"
    Bucket("loan");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
    `
  console.log('take_back manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  console.log("Takes Back sendTransaction Result: ", result.value)

  // Fetch the transaction status from the Gateway SDK
  let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  console.log('Takes Back TransactionAPI transaction/status: ', transactionStatus)

  // fetch commit reciept from gateway api 
  let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  console.log('Takes Back Committed Details Receipt', getCommitReceipt)

  // Show the receipt in the DOM
  document.getElementById('receiptBack').innerText = JSON.stringify(getCommitReceipt);
}

// *********** Takes Back ***********
document.getElementById('takes_back').onclick = async function () {
  let numberOfLndToken = document.getElementById('numberOfLndTokens').value
  let manifest = `
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${lnd_resourceAddress}")
    Decimal("${numberOfLndTokens}");
  TAKE_FROM_WORKTOP
    Address("${lnd_resourceAddress}")
    Decimal("${numberOfLndTokens}")
    Bucket("loan");
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${nft_resourceAddress}")
    Decimal("1");
  TAKE_FROM_WORKTOP
    Address("${nft_resourceAddress}")
    Decimal("1")
    Bucket("nft");  
    CALL_METHOD
    Address("${componentAddress}")
    "takes_back"
    Bucket("loan")
    Bucket("nft");
  CALL_METHOD
    Address("${accountAddress}")
    "try_deposit_batch_or_refund"
    Expression("ENTIRE_WORKTOP");
    `
  console.log('takes_back manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  console.log("Takes Back sendTransaction Result: ", result.value)

  // Fetch the transaction status from the Gateway SDK
  let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  console.log('Takes Back TransactionAPI transaction/status: ', transactionStatus)

  // fetch commit reciept from gateway api 
  let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  console.log('Takes Back Committed Details Receipt', getCommitReceipt)

  // Show the receipt in the DOM
  document.getElementById('receiptsBack').innerText = JSON.stringify(getCommitReceipt);
}



// *********** Fund Development ***********
document.getElementById('fundDevelopment').onclick = async function () {

  let numberOfToken = document.getElementById('numberOfFundedTokens').value
  let manifest = `
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${xrdAddress}")
    Decimal("${numberOfToken}");
  TAKE_ALL_FROM_WORKTOP
    Address("${xrdAddress}")
    Bucket("xrd");
  CALL_METHOD
    Address("${componentAddress}")
    "fund"
    Bucket("xrd");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
    `
  console.log("Fund Development manifest", manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  console.log("Lend Fund Development sendTransaction result: ", result.value)

  // Fetch the transaction status from the Gateway SDK
  let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  console.log('Fund Development transaction status', transactionStatus)

  // fetch commit reciept from gateway api 
  let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  console.log('Fund Development Committed Details Receipt', getCommitReceipt)
}

