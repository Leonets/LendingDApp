import { RadixDappToolkit, DataRequestBuilder, RadixNetwork, NonFungibleIdType } from '@radixdlt/radix-dapp-toolkit'
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

  // fetchLendingsLoanData(accountAddress);
  // fetchMainLoanData(accountAddress);
  fetchMainPoolSize();
  fetchLendingPoolSize();
  fetchUserPosition(accountAddress);
})

// Vaults inside the component component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t
// ["resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc"
// ,"resource_tdx_2_1tk2ck667rpuuj200m5cw9apu4dpdgfrmllvgg5fz3qmet5vxf0srfg"]

//TODO
// prima si deve chiamare con questo payload
// -Final-Url:https://stokenet.radixdlt.com/state/entity/page/non-fungibles/
// con il json body:
// {
//   "address": "account_tdx_2_12y6xp0s3le2mgt8ukdlc78njaxqqjgxuhtjq7k3jr7fkm5qmm9v0fz"
// }

// e poi questo con questo payload
// /state/non-fungible/ids
// and the following body request
// {
//   "resource_address": "resource_tdx_2_1n2wsattx6ju55ya3hg4d4zrmmzrhehj0x964ph55ngdgsv8aezvdvv"
// }


// si trovano gli id con cui leggere i metadata dentro agli NFT 
// /state/non-fungible/data
// with this payload
// {
//   "resource_address": "resource_tdx_2_1n2wsattx6ju55ya3hg4d4zrmmzrhehj0x964ph55ngdgsv8aezvdvv",
//   "non_fungible_ids": [
//     "149ef01d12ede7f5-5cbab77742e47b67-7356c4925239517d-5c16a6ee689247ec"
//   ]
// }


//in alternativa si può usare Entity Details, che dato l'account address ritorna la lista di NFT
// "items": [
//   "{009b461f7fda278c-1402186c5911d793-6ca9e311e05f6ee2-cb44d0d9132c31cd}",
//   "{35f2948e9e39b497-e3b0c0ac82aee757-62368d8eb5900353-08aa5a7df361e666}",
//   "{149ef01d12ede7f5-5cbab77742e47b67-7356c4925239517d-5c16a6ee689247ec}"
//   ],
//   "vault_address": "internal_vault_tdx_2_1nzm8ulqyxfqdht2wfs4k6cmvl3ll3yetspe8xnzsvgvmec5z7wzmg2",
  
//   e poi si può recuperare la lista di metadata


async function fetchUserPosition(accountAddress) {
  // Define the data to be sent in the POST request.
  const requestData = `{
    "addresses": [
      "${accountAddress}"
    ],
    "aggregation_level": "Vault",
    "opt_ins": {
      "ancestor_identities": true,
      "component_royalty_vault_balance": true,
      "package_royalty_vault_balance": true,
      "non_fungible_include_nfids": true,
      "explicit_metadata": [
        "name",
        "description"
      ]
    }
  }`;

  //console.log(" request for entity detail with payload " + requestData);

  // Make an HTTP POST request to your data source (replace 'your-api-endpoint' with the actual endpoint).
  fetch('https://stokenet.radixdlt.com/state/entity/details', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
      // Example usage:
      const resourceAddress = "resource_tdx_2_1n2wsattx6ju55ya3hg4d4zrmmzrhehj0x964ph55ngdgsv8aezvdvv";

      const result = getVaultsByResourceAddress(data, resourceAddress);
      //console.log(" NFT id " + JSON.stringify(result));
      const itemsArray = result[0].items

      // Loop through itemsArray and make GET requests for each item
      itemsArray.forEach(async (item) => {
        await fetchNftMetadata(resourceAddress, item);
      });
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}

function getVaultsByResourceAddress(jsonData, resourceAddress) {
  const items = jsonData.items || [];

  // Filter items based on the resource_address
  const filteredItems = items.filter(item => {
    return (
      item.non_fungible_resources &&
      item.non_fungible_resources.items &&
      item.non_fungible_resources.items.length > 0 &&
      item.non_fungible_resources.items.some(
        resource =>
          resource.resource_address &&
          resource.resource_address === resourceAddress
      )
    );
  });

  //console.log(" filteredItems " + JSON.stringify(filteredItems));

  // Extract vaults from the filtered items
  const vaults = filteredItems.reduce((result, item) => {
    if (
      item.non_fungible_resources &&
      item.non_fungible_resources.items &&
      item.non_fungible_resources.items.length > 0
    ) {
      const matchingResources = item.non_fungible_resources.items.filter(
        resource =>
          resource.resource_address &&
          resource.resource_address === resourceAddress
      );

      matchingResources.forEach(resource => {
        //console.log(" matchingResources " + JSON.stringify(resource));
        if (resource.vaults && resource.vaults.total_count > 0) {
          result.push(...resource.vaults.items);
        }
      });
    }
    return result;
  }, []);

  return vaults;
}

async function fetchNftMetadata(resourceAddress, item) {
  // Define the data to be sent in the GET request.
  const requestData = `{
    "resource_address": "${resourceAddress}",
    "non_fungible_ids": [
      "${item}"
    ]
  }`;

  // Make an HTTP POST request to your data source (replace 'your-api-endpoint' with the actual endpoint).
  fetch('https://stokenet.radixdlt.com/state/non-fungible/data', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
    // Extracting values from the nested structure
    const extractedValues = [];

    data.non_fungible_ids.forEach((id) => {
      id.data.programmatic_json.fields.forEach((field) => {
        const { field_name, value } = field;
        extractedValues.push({ field_name, value });
      });
    });

    //console.log(extractedValues);

    // Find the elements by their IDs
    const amountLiquidityFundedDiv = document.getElementById("amountLiquidityFunded");
    const epochLiquidityFundedDiv = document.getElementById("epochLiquidityFunded");
    // Find the input element by its ID
    const numberOfTokensInput = document.getElementById("numberOfTokens");


    // Assuming 'extractedValues' is not empty
    if (extractedValues.length > 0) {
      // Update the content of the div elements
      amountLiquidityFundedDiv.textContent = extractedValues.find(field => field.field_name === "amount").value;
      epochLiquidityFundedDiv.textContent = extractedValues.find(field => field.field_name === "minted_on").value;
      // Enable the input field
      numberOfTokensInput.readOnly = true;
      //console.error('Disable lending ');
    } else {
      // If 'extractedValues' is empty, disable the input field
      //console.error('Enable lending ');
      numberOfTokensInput.readOnly = false;
    }
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}



async function fetchMainPoolSize() {
  // Define the data to be sent in the POST request.
  const requestData = {
      address: "component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t",
      "resource_address": "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc"
  };

  // Make an HTTP POST request to your data source (replace 'your-api-endpoint' with the actual endpoint).
  fetch('https://stokenet.radixdlt.com/state/entity/page/fungible-vaults/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
      // Check if the response has 'items' and process them.
      if (data && data.items && Array.isArray(data.items)) {
          const amount = data.items.map(item => item.amount);
          console.log('Amount:', amount);
          document.getElementById('mainPool').innerText = JSON.stringify(amount);
      } else {
          console.error('Invalid response format.');
      }
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}


async function fetchLendingPoolSize() {
  // Define the data to be sent in the POST request.
  const requestData = {
      address: "component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t",
      "resource_address": "resource_tdx_2_1tk2ck667rpuuj200m5cw9apu4dpdgfrmllvgg5fz3qmet5vxf0srfg"
  };

  // Make an HTTP POST request to your data source (replace 'your-api-endpoint' with the actual endpoint).
  fetch('https://stokenet.radixdlt.com/state/entity/page/fungible-vaults/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
      // Check if the response has 'items' and process them.
      if (data && data.items && Array.isArray(data.items)) {
          const amount = data.items.map(item => item.amount);
          console.log('Amount:', amount);
          document.getElementById('lendinsPool').innerText = JSON.stringify(amount);
      } else {
          console.error('Invalid response format.');
      }
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}


async function fetchVaultAddresses() {
    // Define the data to be sent in the POST request.
    const requestData = {
        address: "component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t"
    };

    // Make an HTTP POST request to your data source (replace 'your-api-endpoint' with the actual endpoint).
    fetch('https://stokenet.radixdlt.com/state/entity/page/fungibles/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
    .then(response => response.json()) // Assuming the response is JSON data.
    .then(data => {
        // Check if the response has 'items' and process them.
        if (data && data.items && Array.isArray(data.items)) {
            const resourceAddresses = data.items.map(item => item.resource_address);
            console.log('Resource Addresses:', resourceAddresses);
            document.getElementById('mainPool').innerText = JSON.stringify(resourceAddresses);
        } else {
            console.error('Invalid response format.');
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });
}


async function registerUser(accountAddress) {
  const manifest = `
    CALL_METHOD
      Address("${componentAddress}")
      "register";
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");
  `;

  console.log("Register User manifest", manifest);
  const result = await rdt.walletApi.sendTransaction({
    transactionManifest: manifest,
    version: 1,
  });
  if (result.isErr()) {
    console.log("Register User Error: ", result.error);
    throw result.error;
  }

  console.log("Register User sendTransaction result: ", result.value);
  const transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash);
  console.log('Register User transaction status', transactionStatus);
  const getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash);
  console.log('Register User Committed Details Receipt', getCommitReceipt);
}

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
// package_tdx_2_1pk74app6j2d4v23dskdsst3yn7cyufh8x86ejen2aag3d6cwdpjy3z
// Component Address: component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t
// admin_badge address: resource_tdx_2_1t4knvegs8hzxchlxs7qa0kq75nxgv5kv2z5c922x7du2xck7vwlwt6
// owner_badge address: resource_tdx_2_1t5zj4upsuur68uncsrdu6a0k973jn7mk750lgvwgdleh5zypwnrrve
// lnd_resource address: resource_tdx_2_1n2wsattx6ju55ya3hg4d4zrmmzrhehj0x964ph55ngdgsv8aezvdvv
// lnd_token address: resource_tdx_2_1tk2ck667rpuuj200m5cw9apu4dpdgfrmllvgg5fz3qmet5vxf0srfg

// Global states
let componentAddress = "component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t" //LendingDApp component address on stokenet
let lnd_tokenAddress = "resource_tdx_2_1tk2ck667rpuuj200m5cw9apu4dpdgfrmllvgg5fz3qmet5vxf0srfg" // LND token resource address
let lnd_resourceAddress = "resource_tdx_2_1n2wsattx6ju55ya3hg4d4zrmmzrhehj0x964ph55ngdgsv8aezvdvv" // XRD lender badge manager
let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1t4knvegs8hzxchlxs7qa0kq75nxgv5kv2z5c922x7du2xck7vwlwt6"
let owner_badge = "resource_tdx_2_1t5zj4upsuur68uncsrdu6a0k973jn7mk750lgvwgdleh5zypwnrrve"

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
  fetchUserPosition(accountAddress);
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

  fetchUserPosition(accountAddress);
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


