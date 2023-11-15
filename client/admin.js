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


// affected_global_entities: Array(9)
// 0: "transactiontracker_tdx_2_1stxxxxxxxxxxtxtrakxxxxxxxxx006844685494xxxxxxxxxxzw7jp"
// 1: "account_tdx_2_12ya8a0w6dwas8ax8fg9zjc8znr0ymf3a32wysz9epnqar4fle0ldln"
// 2: "component_tdx_2_1cz8wr0jt4z8r4qkfmtw080xvcn8hyaes9xn28l7v2j2zlrds7xgecf"
// 3: "resource_tdx_2_1t5526ghgtz0rkna5hs7tz2w08mwkx57xf8t0qyde926nd4vdu0txsc"
// 4: "resource_tdx_2_1t552x02v6ae34yeznhp0ap9w9je2qvc23zgn9t8reufdgqmqe6qjaq"
// 5: "resource_tdx_2_1ntxjnrzt532cklvus3q68ar8ldp74w8gf7vj7td3ajvqflhcw53dmx"
// 6: "resource_tdx_2_1t4plje7qjldqyznxvlq626ej868w58talk5d2w08ukkgcjpcd5vsq2"
// 7: "resource_tdx_2_1nt47w2ag5a9fl3mk86493rwnfy9q7lxdx9jwm87twg5694gvrslksy"
// 8: "consensusmanager_tdx_2_1scxxxxxxxxxxcnsmgrxxxxxxxxx000999665565xxxxxxxxxv6cg29"
// 
// transaction of the previous component creation is 
//
// https://stokenet-dashboard.radixdlt.com/transaction/txid_tdx_2_1cvvnt45pxylx55kyz7v5nculdtcqjfetmv0u5juahrnvdgsppn5qmh83e2/details
// there you can find the same list of created entities
// 
// this is an example of a removal
// https://stokenet-dashboard.radixdlt.com/transaction/txid_tdx_2_1agezmpcyggzcn400nxxyej6r3px0c6sd4jswkpyhpculd5l4mu3s70d9l4/summary 

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

// Package address v.4
// package_tdx_2_1p544fx9lqdlwg2v2snlamxls4z2dwjzpggetm7vrts6g9zvvdc2xhx
// component_tdx_2_1cqka4kxm98hf9ykj7g4dcv9rxh2vqld6qg6g0ghje6dvuxqny562x8
// admin_badge address: resource_tdx_2_1tkud85qeswfn5ag94a5rcc0kegwgzhltg8xhfwzts53xvlsutl7p9a
// owner_badge address: resource_tdx_2_1t5gtgqjustpsyx3d7rygp3wcd355dm5p4an64nqnm3nqdr8pwucfa4
// lnd_resource address: resource_tdx_2_1ng78xcx0njgdm43l4cfdxn3zsq7pxf94vqlz3x9kanpj2fz2adstqf
// lnd_token address: resource_tdx_2_1th9llwx23cygde0tx32636xmtfr0ln464fwnxgne42fs7a4dnj03hc

// Global states
let componentAddress = "component_tdx_2_1cqka4kxm98hf9ykj7g4dcv9rxh2vqld6qg6g0ghje6dvuxqny562x8" //LendingDApp component address on stokenet
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1tkud85qeswfn5ag94a5rcc0kegwgzhltg8xhfwzts53xvlsutl7p9a"
let owner_badge = "resource_tdx_2_1t5gtgqjustpsyx3d7rygp3wcd355dm5p4an64nqnm3nqdr8pwucfa4"
let lnd_resourceAddress = "resource_tdx_2_1ng78xcx0njgdm43l4cfdxn3zsq7pxf94vqlz3x9kanpj2fz2adstqf" // XRD lender badge manager
let lnd_tokenAddress = "resource_tdx_2_1th9llwx23cygde0tx32636xmtfr0ln464fwnxgne42fs7a4dnj03hc" // LND token resource address

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

// ***** Main function *****
function createTransactionOnClick(elementId, inputTextId, method) {
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
      throw result.error;
    }
  };
}

function generateManifest(method, inputValue) {
  let code;
  switch (method) {
    case 'withdraw_earnings':
      code = ` 
        CALL_METHOD
          Address("${accountAddress}")
          "create_proof_of_amount"    
          Address("${owner_badge}")
          Decimal("1");  
        CALL_METHOD
          Address("${componentAddress}")
          "withdraw_earnings"
          Decimal("${inputValue}");
        CALL_METHOD
          Address("${accountAddress}")
          "deposit_batch"
          Expression("ENTIRE_WORKTOP");
        `;
    break;
    case 'set_period_length':
      code = ` 
        CALL_METHOD
          Address("${accountAddress}")
          "create_proof_of_amount"    
          Address("${admin_badge}")
          Decimal("1");
        CALL_METHOD
          Address("${componentAddress}")
          "set_period_length"
          Decimal("${inputValue}");
        CALL_METHOD
          Address("${accountAddress}")
          "deposit_batch"
          Expression("ENTIRE_WORKTOP");
       `;
    break;
    case 'mint_staff_badge':
      code = ` 
        CALL_METHOD
          Address("${accountAddress}")
          "create_proof_of_amount"    
          Address("${admin_badge}")
          Decimal("1");
        CALL_METHOD
          Address("${componentAddress}")
          "mint_staff_badge"
          "${inputValue}";
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
    // Add more cases as needed
    default:
      throw new Error(`Unsupported method: ${method}`);
  }

  return code;
}


// Usage
createTransactionOnClick('WithdrawEarnings', 'numberOfEarnedToken', 'withdraw_earnings');
createTransactionOnClick('mintStaffBadge', 'staffUsername', 'mint_staff_badge');
createTransactionOnClick('setPeriodLength', 'periodLength', 'set_period_length');
createTransactionOnClick('extendLendingPool', 'extendLendingPoolAmount', 'extend_lending_pool');
createTransactionOnClick('setReward', 'reward', 'set_reward');

