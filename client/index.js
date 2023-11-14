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

// Package address v.0
// package_tdx_2_1pk74app6j2d4v23dskdsst3yn7cyufh8x86ejen2aag3d6cwdpjy3z
// Component Address: component_tdx_2_1cqj0v52hvc3cs2gq9ekyswt7d2qcze3y6t8nhswhuyl8y9z8395y2t
// admin_badge address: resource_tdx_2_1t4knvegs8hzxchlxs7qa0kq75nxgv5kv2z5c922x7du2xck7vwlwt6
// owner_badge address: resource_tdx_2_1t5zj4upsuur68uncsrdu6a0k973jn7mk750lgvwgdleh5zypwnrrve
// lnd_resource address: resource_tdx_2_1n2wsattx6ju55ya3hg4d4zrmmzrhehj0x964ph55ngdgsv8aezvdvv
// lnd_token address: resource_tdx_2_1tk2ck667rpuuj200m5cw9apu4dpdgfrmllvgg5fz3qmet5vxf0srfg

// Package address v.1
// package_tdx_2_1phc5hj90sszhl0kmqmjp6hetjhtfylwygpgy4nzptcghxclz7rt3rn
// Component Address: component_tdx_2_1crz9cma45dgzc7a8phu9zzmzfzy4uqw3hx548gwc9wpehrw8qvudkk
// admin_badge address: resource_tdx_2_1thnlgyksrxupu8npjanj0a7zxrkd47uunwfnhfxcvtg9futupt7xyu
// owner_badge address: resource_tdx_2_1t4r3h9ccm8ywpw9jufhj0046wv4nm5c7ugmk2tf25wr5hwqruvrzad
// lnd_resource address: resource_tdx_2_1n2ufck30hzamejc70tpe9cz85jfj7hnpzu2w6pswxlz72tkwln7jen
// lnd_token address: resource_tdx_2_1t4dhmqczjsmkc7va205vq3d8euu04x5ea5xfzydmx78fncsa540g8g

// Package address v.2
// package_tdx_2_1p5k80fw08d0eh5pvjpv47xf46r349yutstherngrsnjnlxpjrerqk0
// Component Address: component_tdx_2_1cqappdlhv6yjp9ukfq8edc5jf4mc3z4xaptmewped6e607lm8kys8r
// admin_badge address: resource_tdx_2_1t4rjdv0tjw5wlq4gqukyasx3u7d3nvr5yaj5za6dsg0nl2qhsxj7p7
// owner_badge address: resource_tdx_2_1t4z8z7ukjta56m3jukqjgsed74yesq35zeczuuqvvz94skme44trwz
// lnd_resource address: resource_tdx_2_1ntwnlyepercr75yhn48ucgedj8ka6gap2hgc6ejes4v892l6k273pz
// lnd_token address: resource_tdx_2_1t4s6usewhkshfy8c9tdfqy7p6svljfr8c9dg3kvrjfm6r40mp3u9s8

// Package address v.3
// package_tdx_2_1p4kgj0a9u70yfehtasujavc2ykdl3rmxphnysnnf6xe0k5ufjeuegq
// Component Address: component_tdx_2_1cqy0kyz2ag8n5spkxw6spd6rdfn8xshfdgyqu64dzln3mm6kp5vqjz
// admin_badge address: resource_tdx_2_1thyh2xqk27x2rvrr6rhf7qlqekz5pufg6zqncuk2wegcrm5nnyk2hw
// owner_badge address: resource_tdx_2_1tkgqwyh8c2zdavvrml75en2ttq84f6e3rz49c00tfp5cqzu4q4aj8w
// lnd_resource address: resource_tdx_2_1n2xdv5skm3x8cr3mdcm7x78z678vjfjpuufa0mzjs7utd2guzmqnmq
// lnd_token address: resource_tdx_2_1thggqkegwda56rj6tvuanqglfeq0v45f3d03l95dpjwz26v2z5y9wq


// Global states
let componentAddress = "component_tdx_2_1cqy0kyz2ag8n5spkxw6spd6rdfn8xshfdgyqu64dzln3mm6kp5vqjz" //LendingDApp component address on stokenet
let lnd_tokenAddress = "resource_tdx_2_1thggqkegwda56rj6tvuanqglfeq0v45f3d03l95dpjwz26v2z5y9wq" // LND token resource address
let lnd_resourceAddress = "resource_tdx_2_1n2xdv5skm3x8cr3mdcm7x78z678vjfjpuufa0mzjs7utd2guzmqnmq" // XRD lender badge manager
let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1thyh2xqk27x2rvrr6rhf7qlqekz5pufg6zqncuk2wegcrm5nnyk2hw"
let owner_badge = "resource_tdx_2_1tkgqwyh8c2zdavvrml75en2ttq84f6e3rz49c00tfp5cqzu4q4aj8w"

let accountAddress
let accountName

// ************ Fetch the user's account address (Page Load) ************
rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1))
// Subscribe to updates to the user's shared wallet data
rdt.walletApi.walletData$.subscribe((walletData) => {
  console.log("subscription wallet data: ", walletData)
  accountName = walletData.accounts[0].label
  accountAddress = walletData.accounts[0].address

  //fetch pool size
  fetchMainPoolSize(componentAddress, xrdAddress);
  fetchLendingPoolSize(componentAddress, xrdAddress);
  //fetch nft metadata info of the connected user
  fetchUserPosition(accountAddress);
  //get config parameter of the component
  fetchComponentConfig(componentAddress);
})

// ************ Utility Function (Gateway) *****************
function generatePayload(method, address, type) {
  let code;
  switch (method) {
    case 'ComponentConfig':
      code = `{
        "addresses": [
          "${componentAddress}"
        ],
        "aggregation_level": "Global",
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
    break;
    case 'UserPosition':
      code = `{
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
    break;    
    // Add more cases as needed
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  return code;
}

// *********** Fetch Component Config (/state/entity/details) (Gateway) ***********
async function fetchComponentConfig(componentAddress) {
  // Define the data to be sent in the POST request.
  const requestData = generatePayload("ComponentConfig", "", "Global");

  // Make an HTTP POST request to the gateway
  fetch('https://stokenet.radixdlt.com/state/entity/details', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
    const json = data.items ? data.items[0] : null;
    const rewardValue = getReward(json);
    const periodLengthValue = getPeriodLength(json);

    // console.log("Reward:", rewardValue);
    // console.log("Period Length:", periodLengthValue);
    const rewardForYouConfig = document.getElementById("rewardForYou");
    const periodLengthConfig = document.getElementById("periodLengthConfig");
    rewardForYouConfig.textContent = rewardValue;
    periodLengthConfig.textContent = periodLengthValue;
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}

function getReward(data) {
  const rewardField = data.details.state.fields.find(field => field.field_name === "reward");
  return rewardField ? rewardField.value : null;
}

function getPeriodLength(data) {
  const periodLengthField = data.details.state.fields.find(field => field.field_name === "period_length");
  return periodLengthField ? periodLengthField.value : null;
}


// *********** Fetch User NFT Metadata Information (/entity/details) (Gateway) ***********
async function fetchUserPosition(accountAddress) {
  // Define the data to be sent in the POST request.
  const requestData = generatePayload("UserPosition", "", "Vault");

  // Make an HTTP POST request to the gateway
  fetch('https://stokenet.radixdlt.com/state/entity/details', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
      const resourceAddress = `${lnd_resourceAddress}`;
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

// *********** Fetch User NFT Metadata Information (Filtering response) (Gateway Utility) ***********
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
        console.log(" matchingResources " + JSON.stringify(resource));
        if (resource.vaults && resource.vaults.total_count > 0) {
          result.push(...resource.vaults.items);
        }
      });
    }
    return result;
  }, []);

  return vaults;
}

// *********** Fetch User NFT Metadata Information (/non-fungible/data) (Gateway Utility) ***********
async function fetchNftMetadata(resourceAddress, item) {
  // Define the data to be sent in the GET request.
  const requestData = `{
    "resource_address": "${resourceAddress}",
    "non_fungible_ids": [
      "${item}"
    ]
  }`;

  // Make an HTTP POST request to the gateway
  fetch('https://stokenet.radixdlt.com/state/non-fungible/data', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) 
  .then(data => { 
    // Extracting values from the nested structure
    const extractedValues = [];

    data.non_fungible_ids.forEach((id) => {
      id.data.programmatic_json.fields.forEach((field) => {
        const { field_name, value } = field;
        extractedValues.push({ field_name, value });
      });
    });

    // Find the elements by their IDs
    const amountLiquidityFundedDiv = document.getElementById("amountLiquidityFunded");
    const epochLiquidityFundedDiv = document.getElementById("epochLiquidityFunded");
    // Find the input element by its ID
    const numberOfTokensInput = document.getElementById("numberOfTokens");

    // Update the content of the div elements
    amountLiquidityFundedDiv.textContent = extractedValues.find(field => field.field_name === "amount").value;
    epochLiquidityFundedDiv.textContent = extractedValues.find(field => field.field_name === "start_lending_epoch").value;
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}

// TODO Please refactor
// *********** Register User ***********
document.getElementById('register').onclick = async function () {  
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
  //TODO when the user gets registered... then enable Lend/Take Back buttons
}

// TODO Please refactor
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
    `
  console.log("Lend Tokens manifest", manifest)

  // Send manifest to extension for signing
  const result = await rdt.walletApi
    .sendTransaction({
      transactionManifest: manifest,
      version: 1,
    })

  if (result.isErr()) {
    console.log("Lend Tokens sendTransaction Error: ", result.error.message)  
    document.getElementById('lendTxResult').textContent = extractErrorMessage(result.error.message);
    throw result.error
  }
  console.log("Lend Tokens sendTransaction result: ", result.value)  

  // Fetch the transaction status from the Gateway SDK
  let transactionStatus = await rdt.gatewayApi.transaction.getStatus(result.value.transactionIntentHash)
  console.log('Lend Tokens transaction status', transactionStatus)

  // fetch commit reciept from gateway api 
  let getCommitReceipt = await rdt.gatewayApi.transaction.getCommittedDetails(result.value.transactionIntentHash)
  console.log('Lend Tokens Committed Details Receipt', getCommitReceipt)

  // Show the receipt in the DOM
  // document.getElementById('receiptLend').innerText = JSON.stringify(getCommitReceipt);
  fetchUserPosition(accountAddress);
}


// TODO Please refactor
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

// *********** Fetch Main Pool size (Gateway) ***********
async function fetchMainPoolSize(component, xrdAddress) {
  // Define the data to be sent in the POST request.
  console.log('Request data for Main Pool size for component = ', `${component}`)
  const requestData = `{
      "address": "${component}",
      "resource_address": "${xrdAddress}"
  }`;
  console.log('Request data for Main Pool size', requestData)

  // Make an HTTP POST request to the gateway
  fetch('https://stokenet.radixdlt.com/state/entity/page/fungible-vaults/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) 
  .then(data => { 
      // Check if the response has 'items' and process them.
      if (data && data.items && Array.isArray(data.items)) {
          const amount = data.items.map(item => item.amount);
          document.getElementById('mainPool').innerText = JSON.stringify(amount);
      } else {
          console.error('Invalid response format.');
      }
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}

// *********** Fetch Lendings Pool size (Gateway) ***********
async function fetchLendingPoolSize(component, xrdAddress) {
  // Define the data to be sent in the POST request.
  const requestData = `{
    address: "${component}",
    "resource_address": "${lnd_tokenAddress}"
}`;

  // Make an HTTP POST request to the gateway
  fetch('https://stokenet.radixdlt.com/state/entity/page/fungible-vaults/', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: requestData,
  })
  .then(response => response.json()) 
  .then(data => { 
      // Check if the response has 'items' and process them.
      if (data && data.items && Array.isArray(data.items)) {
          const amount = data.items.map(item => item.amount);
          document.getElementById('lendinsPool').innerText = JSON.stringify(amount);
      } else {
          console.error('Invalid response format.');
      }
  })
  .catch(error => {
      console.error('Error fetching data:', error);
  });
}


// *********** Not used  ***********
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

function extractErrorMessage(inputString) {
  const regex = /PanicMessage\("([^@]*)@/;
  const match = regex.exec(inputString);
  if (match && match[1]) {
    return match[1];
  } else {
    return "No match found";
  }
}
