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
  accountName = walletData.accounts[0].label
  accountAddress = walletData.accounts[0].address

  fetchLendingsLoanData(accountAddress);
  fetchMainLoanData(accountAddress);
})


async function fetchMainLoanData(accountAddress) {
  const manifest = `
    CALL_METHOD
      Address("${componentAddress}")
      "main_pool_size";
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");
  `;

  console.log("Main Vault manifest", manifest);
  const result = await rdt.walletApi.sendTransaction({
    transactionManifest: manifest,
    version: 1,
  });
  if (result.isErr()) {
    console.log("Main Vault Error: ", result.error);
    throw result.error;
  }

  console.log("Main Vault sendTransaction result: ", result.value);
  const transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash);
  console.log('Main Vault transaction status', transactionStatus);
  const getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash);
  console.log('Main Vault Committed Details Receipt', getCommitReceipt);
  document.getElementById('mainPool').innerText = JSON.stringify(getCommitReceipt);
}

async function fetchLendingsLoanData(accountAddress) {
  const manifest = `
    CALL_METHOD
      Address("${componentAddress}")
      "lendings_pool_size";
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");
  `;

  console.log("Lendings Vault manifest", manifest);
  const result = await rdt.walletApi.sendTransaction({
    transactionManifest: manifest,
    version: 1,
  });
  if (result.isErr()) {
    throw result.error;
  }

  console.log("Lendings Vault sendTransaction result: ", result.value);
  const transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash);
  console.log('Lendings Vault transaction status', transactionStatus);
  const getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash);
  console.log('Lendings Vault Committed Details Receipt', getCommitReceipt);
  document.getElementById('lendinsPool').innerText = JSON.stringify(getCommitReceipt);
}


// Package address
// package_tdx_2_1pksnyqzl09695rw5lmpz3lyqnzjs3fv0eykcsm73ukr8ys3qnj9htt
// Component Address: component_tdx_2_1cp9qaexumwuys7hs0m8tm6ss78jjpxf6agtff9c39evzylh2x8kcwz
// admin_badge address: resource_tdx_2_1thwg8g2l8qu6626xd8t2caz37tm4q9xvhcshsffwnvv459sskhhada
// owner_badge address: resource_tdx_2_1thfnrmmmy0jqlju69gwgqch2a07cprde5zc9930t79nysdptrmawnx
// lnd_resource address: resource_tdx_2_1ngzty5d7xvwkgefznd2msmerwk4398fe7t3dndgcjqgcex8st5fsem
// lnd_token address: resource_tdx_2_1the4ctqp5ts2n96nynmhgx0erzmk0exqq42fjxfujv5jr0yxma4dfl

// Global states
let componentAddress = "component_tdx_2_1cp9qaexumwuys7hs0m8tm6ss78jjpxf6agtff9c39evzylh2x8kcwz" //LendingDApp component address on stokenet
let lnd_tokenAddress = "resource_tdx_2_1the4ctqp5ts2n96nynmhgx0erzmk0exqq42fjxfujv5jr0yxma4dfl" // LND token resource address
let lnd_resourceAddress = "resource_tdx_2_1ngzty5d7xvwkgefznd2msmerwk4398fe7t3dndgcjqgcex8st5fsem" // XRD lender badge manager
let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1thwg8g2l8qu6626xd8t2caz37tm4q9xvhcshsffwnvv459sskhhada"
let owner_badge = "resource_tdx_2_1thfnrmmmy0jqlju69gwgqch2a07cprde5zc9930t79nysdptrmawnx"

// *********** Lends Token ***********
document.getElementById('lendTokens').onclick = async function () {
  console.log("componentAddress", componentAddress)
  console.log("lnd_resourceAddress", lnd_resourceAddress)
  console.log("lnd_tokenAddress", lnd_tokenAddress)
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



// *********** Takes Back ***********
document.getElementById('takes_back').onclick = async function () {
  console.log("componentAddress", componentAddress)
  console.log("lnd_resourceAddress", lnd_resourceAddress)
  console.log("lnd_tokenAddress", lnd_tokenAddress)
  console.log("admin_badge", admin_badge)
  console.log("owner_badge", owner_badge)

  console.log("accountName", accountAddress)
  console.log("accountAddress", accountAddress)

  let numberOfLndTokens = document.getElementById('numberOfLndTokens').value
  let manifest = `
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${lnd_tokenAddress}")
    Decimal("${numberOfLndTokens}");
  TAKE_FROM_WORKTOP
    Address("${lnd_tokenAddress}")
    Decimal("${numberOfLndTokens}")
    Bucket("loan");
  CALL_METHOD
    Address("${accountAddress}")
    "withdraw"    
    Address("${lnd_resourceAddress}")
    Decimal("1");
  TAKE_FROM_WORKTOP
    Address("${lnd_resourceAddress}")
    Decimal("1")
    Bucket("nft");  
  CALL_METHOD
    Address("${componentAddress}")
    "takes_back"
    Bucket("loan")
    Bucket("nft");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
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


