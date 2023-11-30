import { RadixDappToolkit, DataRequestBuilder, RadixNetwork, NonFungibleIdType } from '@radixdlt/radix-dapp-toolkit'
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


// Tx ID
// txid_tdx_2_1dgq7mzm3jfj4s9522tyjz2pvdnyypc0gpgwwcdmjlg56k8gpzvzs5nul2m
// Package address v.9
// package_tdx_2_1pkwdc4f337wmdnhyl6jfysnh9zlqntayfc3x6qaglelffxgjufqx2r
// Component Address: component_tdx_2_1czq3c2ptkyz6jtjkq5xee9kwns29xhdmqcaxu8uc9ass54d3rvwc94
// admin_badge address: resource_tdx_2_1t43elum4rz5mdzt6sprqa9z3ahhatttwwm36sslrm0puywct3hy7km
// owner_badge address: resource_tdx_2_1t4ta06v8jrvu82vzpz5rzpe88q7ap73qcfaa4zww0zjq4ty2fw3zwh
// lnd_resource address: resource_tdx_2_1n2va2fmhvuv50wqknf5fu0v3cqghkf4yr69n0xmj58u27ht2262mf9
// lnd_token address: resource_tdx_2_1th6tw0wudvswqse9jxkq5237fe2q46jt9p4af5wdejwvrdmjyu9q4s

// Global states
let componentAddress = "component_tdx_2_1czq3c2ptkyz6jtjkq5xee9kwns29xhdmqcaxu8uc9ass54d3rvwc94" //LendingDApp component address on stokenet
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1t43elum4rz5mdzt6sprqa9z3ahhatttwwm36sslrm0puywct3hy7km"
let owner_badge = "resource_tdx_2_1t4ta06v8jrvu82vzpz5rzpe88q7ap73qcfaa4zww0zjq4ty2fw3zwh"
let lnd_resourceAddress = "resource_tdx_2_1n2va2fmhvuv50wqknf5fu0v3cqghkf4yr69n0xmj58u27ht2262mf9" // XRD lender badge manager
let lnd_tokenAddress = "resource_tdx_2_1th6tw0wudvswqse9jxkq5237fe2q46jt9p4af5wdejwvrdmjyu9q4s" // LND token resource address

let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address

let accountAddress
let accountName

// ************ Fetch the user's account address (Page Load) ************
rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))
// Subscribe to updates to the user's shared wallet data
rdt.walletApi.walletData$.subscribe((walletData) => {
  console.log("subscription wallet data: ", walletData)
  accountName = walletData.accounts[0].label
  accountAddress = walletData.accounts[0].address
})


// ***** Main function *****
function createTransactionOnClick(elementId, inputTextId, method, errorField) {
  document.getElementById(elementId).onclick = async function () {
    let inputValue = document.getElementById(inputTextId).value;
    console.log(`got inputValue = `, inputValue);

    const manifest = generateManifest(method, inputValue);
    console.log(`${method} manifest`, manifest);

    const result = await rdt.walletApi.sendTransaction({
      transactionManifest: manifest,
      version: 1,
    });
    if (result.isErr()) {
      console.log(`${method} User Error: `, result.error);
      document.getElementById(errorField).textContent = extractErrorMessage(result.error.message);
      throw result.error;
    }

    // await fetchUserPosition(accountAddress);
  };

}

// ***** Utility function *****
function generateManifest(method, inputValue) {
  let code;
  switch (method) {
    case 'lend_tokens':
      code = `
        CALL_METHOD
          Address("${accountAddress}")
          "withdraw"    
          Address("${xrdAddress}")
          Decimal("${inputValue}");
        TAKE_ALL_FROM_WORKTOP
          Address("${xrdAddress}")
          Bucket("xrd");
        CALL_METHOD
          Address("${accountAddress}")
          "withdraw"    
          Address("${lnd_resourceAddress}")
          Decimal("1");
        TAKE_ALL_FROM_WORKTOP
          Address("${lnd_resourceAddress}")
          Bucket("nft");    
        CALL_METHOD
          Address("${componentAddress}")
          "lend_tokens"
          Bucket("xrd")
          Bucket("nft");
        CALL_METHOD
          Address("${accountAddress}")
          "deposit_batch"
          Expression("ENTIRE_WORKTOP");
          `;
      break;
    case 'register':
      code = ` 
        CALL_METHOD
          Address("${componentAddress}")
          "register";
        CALL_METHOD
          Address("${accountAddress}")
          "deposit_batch"
          Expression("ENTIRE_WORKTOP");
      `;
      break;
    case 'takes_back':
      code = `
        CALL_METHOD
          Address("${accountAddress}")
          "withdraw"    
          Address("${lnd_tokenAddress}")
          Decimal("${inputValue}");
        TAKE_FROM_WORKTOP
          Address("${lnd_tokenAddress}")
          Decimal("${inputValue}")
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
          `;
      break;
    case 'extend_lending_pool':
      code = ` 
        CALL_METHOD
          Address("${accountAddress}")
          "create_proof_of_amount"    
          Address("${admin_badge}")
          Decimal("1");
        CALL_METHOD
          Address("${componentAddress}")
          "extend_lending_pool"
          Decimal("${inputValue}");
        CALL_METHOD
          Address("${accountAddress}")
          "deposit_batch"
          Expression("ENTIRE_WORKTOP");
        `;
    break;     
    case 'set_reward':
      code = ` 
        CALL_METHOD
          Address("${accountAddress}")
          "create_proof_of_amount"    
          Address("${admin_badge}")
          Decimal("1");
        CALL_METHOD
          Address("${componentAddress}")
          "set_reward"
          Decimal("${inputValue}");
        CALL_METHOD
          Address("${accountAddress}")
          "deposit_batch"
          Expression("ENTIRE_WORKTOP");
       `;
      break;   
      case 'set_interest':
        code = ` 
          CALL_METHOD
            Address("${accountAddress}")
            "create_proof_of_amount"    
            Address("${admin_badge}")
            Decimal("1");
          CALL_METHOD
            Address("${componentAddress}")
            "set_interest"
            Decimal("${inputValue}");
          CALL_METHOD
            Address("${accountAddress}")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP");
         `;
        break;           
      case 'fund_main_pool':
        code = `
          CALL_METHOD
            Address("${accountAddress}")
            "create_proof_of_amount"    
            Address("${admin_badge}")
            Decimal("1");              
          CALL_METHOD
            Address("${accountAddress}")
            "withdraw"    
            Address("${xrdAddress}")
            Decimal("${inputValue}");
          TAKE_ALL_FROM_WORKTOP
            Address("${xrdAddress}")
            Bucket("xrd");
          CALL_METHOD
            Address("${componentAddress}")
            "fund_main_pool"
            Bucket("xrd");      
          CALL_METHOD
            Address("${accountAddress}")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP");
            `;
        break;           
    // Add more cases as needed
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  return code;
}


// Usage
// createTransactionOnClick (elementId = divId del button, inputTextId = divId del field di inserimento, method = scrypto method)
createTransactionOnClick('register', 'unknown', 'register', 'registerTxResult');
createTransactionOnClick('lendTokens', 'numberOfTokens', 'lend_tokens', 'lendTxResult');
createTransactionOnClick('takes_back', 'numberOfLndTokens', 'takes_back', 'takeBackTxResult');

// TODO Please refactor
// *********** Register User ***********
// document.getElementById('register').onclick = async function () {  
//   const manifest = ` 
//     CALL_METHOD
//       Address("${componentAddress}")
//       "register";
//     CALL_METHOD
//       Address("${accountAddress}")
//       "deposit_batch"
//       Expression("ENTIRE_WORKTOP");
//   `;

//   console.log("Register User manifest", manifest);
//   const result = await rdt.walletApi.sendTransaction({
//     transactionManifest: manifest,
//     version: 1,
//   });
//   if (result.isErr()) {
//     console.log("Register User Error: ", result.error);
//     throw result.error;
//   }

//   console.log("Register User sendTransaction result: ", result.value);
//   const transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash);
//   console.log('Register User transaction status', transactionStatus);
//   const getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash);
//   console.log('Register User Committed Details Receipt', getCommitReceipt);
//   //TODO when the user gets registered... then enable Lend/Take Back buttons
// }


// TODO Please refactor
// *********** Takes Back ***********
// document.getElementById('takes_back').onclick = async function () {

//   let numberOfLndTokens = document.getElementById('numberOfLndTokens').value
//   let manifest = `
//   CALL_METHOD
//     Address("${accountAddress}")
//     "withdraw"    
//     Address("${lnd_tokenAddress}")
//     Decimal("${numberOfLndTokens}");
//   TAKE_FROM_WORKTOP
//     Address("${lnd_tokenAddress}")
//     Decimal("${numberOfLndTokens}")
//     Bucket("loan");
//   CALL_METHOD
//     Address("${accountAddress}")
//     "withdraw"    
//     Address("${lnd_resourceAddress}")
//     Decimal("1");
//   TAKE_FROM_WORKTOP
//     Address("${lnd_resourceAddress}")
//     Decimal("1")
//     Bucket("nft");  
//   CALL_METHOD
//     Address("${componentAddress}")
//     "takes_back"
//     Bucket("loan")
//     Bucket("nft");
//   CALL_METHOD
//     Address("${accountAddress}")
//     "deposit_batch"
//     Expression("ENTIRE_WORKTOP");
//     `
//   console.log('takes_back manifest: ', manifest)

//   // Send manifest to extension for signing
//   const result = await rdt.walletApi
//     .sendTransaction({
//       transactionManifest: manifest,
//       version: 1,
//     })
//   if (result.isErr()) throw result.error
//   console.log("Takes Back sendTransaction Result: ", result.value)

//   // Fetch the transaction status from the Gateway SDK
//   let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
//   console.log('Takes Back TransactionAPI transaction/status: ', transactionStatus)

//   // fetch commit reciept from gateway api 
//   let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
//   console.log('Takes Back Committed Details Receipt', getCommitReceipt)

//   await fetchUserPosition(accountAddress);
// };

// Use a delay or handle the asynchrony appropriately
// setTimeout(() => {
//   // Call the asynchronous function immediately (for demonstration purposes)
//   fetchUserPosition(accountAddress);
// }, 1000);



// TODO Please refactor
// *********** Takes Back ***********
document.getElementById('borrow').onclick = async function () {
  let numberOfRequestedXrdTokens = document.getElementById('numberOfRequestedXrdTokens').value
  let manifest = `
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
    "borrow"
    Decimal("${numberOfRequestedXrdTokens}")
    Bucket("nft");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
    `
  console.log('borrow manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  // console.log("Takes Back sendTransaction Result: ", result.value)

  // // Fetch the transaction status from the Gateway SDK
  // let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  // console.log('Takes Back TransactionAPI transaction/status: ', transactionStatus)

  // // fetch commit reciept from gateway api 
  // let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  // console.log('Takes Back Committed Details Receipt', getCommitReceipt)

  fetchUserPosition(accountAddress);
}




// TODO Please refactor
// *********** repay ***********
document.getElementById('repay').onclick = async function () {
  let numberOfRepaiedXrdTokens = document.getElementById('numberOfRepaiedXrdTokens').value
  let manifest = `
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
    Address("${accountAddress}")
    "withdraw"    
    Address("${xrdAddress}")
    Decimal("${numberOfRepaiedXrdTokens}");
  TAKE_FROM_WORKTOP
    Address("${xrdAddress}")
    Decimal("${numberOfRepaiedXrdTokens}")
    Bucket("repay");  
  CALL_METHOD
    Address("${componentAddress}")
    "repay"
    Bucket("repay")
    Bucket("nft");
  CALL_METHOD
    Address("${accountAddress}")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
    `
  console.log('borrow manifest: ', manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })
  if (result.isErr()) throw result.error
  // console.log("Takes Back sendTransaction Result: ", result.value)

  // // Fetch the transaction status from the Gateway SDK
  // let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  // console.log('Takes Back TransactionAPI transaction/status: ', transactionStatus)

  // // fetch commit reciept from gateway api 
  // let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  // console.log('Takes Back Committed Details Receipt', getCommitReceipt)

  fetchUserPosition(accountAddress);
}

// TODO Please refactor
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


function extractErrorMessage(inputString) {
  const regex = /PanicMessage\("([^@]*)@/;
  const match = regex.exec(inputString);
  if (match && match[1]) {
    return match[1];
  } else {
    return "No match found";
  }
}
