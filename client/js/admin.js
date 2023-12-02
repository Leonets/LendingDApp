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
  // document.getElementById('accountName').innerText = walletData.accounts[0].label
  // document.getElementById('accountAddress').innerText = walletData.accounts[0].address
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


// Component Address: component_tdx_2_1cpt0u9amrge2mun4fm6wj5a36lllw3xdz3zhsr0e24z30q6he9282e
// admin_badge address: resource_tdx_2_1t5scjm7jahrdlz7tpj65jtp6nfyn8yntta47v560etcdlh9vvtvkuh
// owner_badge address: resource_tdx_2_1ths8ctje6ykw07a470yulksc7wraxlmjq3r9c7d58msr0l50qwjlyk
// lnd_resource address: resource_tdx_2_1ntml7y49kxsan0y44298j3zs3fsv3khnv60am7se9mc7hwaa22fwp9
// lnd_token address: resource_tdx_2_1t5afkgud2kw8hjmywtju272gpx9mukc3dqpvkxcn74sdwkee4emyg6


// Global states
let componentAddress = "component_tdx_2_1cpt0u9amrge2mun4fm6wj5a36lllw3xdz3zhsr0e24z30q6he9282e" //LendingDApp component address on stokenet
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1t5scjm7jahrdlz7tpj65jtp6nfyn8yntta47v560etcdlh9vvtvkuh"
let owner_badge = "resource_tdx_2_1ths8ctje6ykw07a470yulksc7wraxlmjq3r9c7d58msr0l50qwjlyk"
let lnd_resourceAddress = "resource_tdx_2_1ntml7y49kxsan0y44298j3zs3fsv3khnv60am7se9mc7hwaa22fwp9" // XRD lender badge manager
let lnd_tokenAddress = "resource_tdx_2_1t5afkgud2kw8hjmywtju272gpx9mukc3dqpvkxcn74sdwkee4emyg6" // LND token resource address


let xrdAddress = "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc" //Stokenet XRD resource address

// ***** Main function (elementId = divId del button, inputTextId = divId del field di inserimento, method = scrypto method) *****
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
createTransactionOnClick('WithdrawEarnings', 'numberOfEarnedToken', 'withdraw_earnings');
createTransactionOnClick('mintStaffBadge', 'staffUsername', 'mint_staff_badge');
createTransactionOnClick('setPeriodLength', 'periodLength', 'set_period_length');
createTransactionOnClick('extendLendingPool', 'extendLendingPoolAmount', 'extend_lending_pool');
createTransactionOnClick('setReward', 'reward', 'set_reward');
createTransactionOnClick('setInterest', 'interest', 'set_interest');
createTransactionOnClick('fundMainPool', 'numberOfFundedTokens', 'fund_main_pool');
