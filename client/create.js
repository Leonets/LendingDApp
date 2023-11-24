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

// Package address v.7
// package_tdx_2_1pkv623effm52fjmug2lstp69hu42rlsm3zpalsdsr020jmsn539hmr
// Component Address: component_tdx_2_1cqdlgpyv5w6napra38ya83s2vj2psn00z0f5j3vnyvzlcf0dcg94tc
// admin_badge address: resource_tdx_2_1t5yw40l9nesezl2wztw9zg39v3k64fs67thm2exa3sn6knw0dkvdzu
// owner_badge address: resource_tdx_2_1t44haerhjyha52l67l6hdd5c439644cp3vl9cs435ftv3yywppshah
// lnd_resource address: resource_tdx_2_1nt4xm5mwdahv4vyft8hhvpkcq5s4z7hu0qav4248sad2ursmkj8327
// lnd_token address: resource_tdx_2_1thk2uhpmvg5u5964t8kxeg5h69jnvch5jmmekmregw440yvf940am4

// Package address v.8
// package_tdx_2_1pkw45plqnw5p93dcy2574m8hcgpyuvksuv4xkhk0f4y77xaul5kus3
// Component Address: component_tdx_2_1cry98tgseee2ugz0syfnkt090gsvemm6xjwkm7jk9sxyj8hmweynk4
// admin_badge address: resource_tdx_2_1t5zmjcdvrexeevg4pjx3h4jwvkcndwd53khqgvnln560p389uzh83g
// owner_badge address: resource_tdx_2_1t5zjxt622dzs60mjec8g8qdmr0ptd4u0qcxw93f46vfafl9tk2z6jl
// lnd_resource address: resource_tdx_2_1n2yr7tjehsj3j0le9kl6ayngzq7geugkamwy7535rnl2td2jvf2z5k
// lnd_token address: resource_tdx_2_1tkfd9xnnswu9a4rl6cyrmnyktstq4l4qfk92vef879z0xku49qvdyn

// Global states
let componentAddress = "component_tdx_2_1cry98tgseee2ugz0syfnkt090gsvemm6xjwkm7jk9sxyj8hmweynk4" //LendingDApp component address on stokenet
// You receive this badge(your resource address will be different) when you instantiate the component
let admin_badge = "resource_tdx_2_1t5zmjcdvrexeevg4pjx3h4jwvkcndwd53khqgvnln560p389uzh83g"
let owner_badge = "resource_tdx_2_1t5zjxt622dzs60mjec8g8qdmr0ptd4u0qcxw93f46vfafl9tk2z6jl"
let lnd_resourceAddress = "resource_tdx_2_1n2yr7tjehsj3j0le9kl6ayngzq7geugkamwy7535rnl2td2jvf2z5k" // XRD lender badge manager
let lnd_tokenAddress = "resource_tdx_2_1tkfd9xnnswu9a4rl6cyrmnyktstq4l4qfk92vef879z0xku49qvdyn" // LND token resource address

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
    Decimal("10")
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
  lnd_resourceAddress = getCommitReceipt.transaction.affected_global_entities[8];
  document.getElementById('lnd_resourceAddress').innerText = lnd_resourceAddress;

  // ****** Set lnd_tokenAddress variable with gateway api getCommitReciept payload ******
  lnd_tokenAddress = getCommitReceipt.transaction.affected_global_entities[7];
  document.getElementById('lnd_tokenAddress').innerText = lnd_tokenAddress;
}
