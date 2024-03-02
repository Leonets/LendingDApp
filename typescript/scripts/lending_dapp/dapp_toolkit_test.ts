import { config } from '../../config'
import { RadixDappToolkit, RadixNetwork } from '@radixdlt/radix-dapp-toolkit'

// Set an environment variable to indicate the current environment
const environment = process.env.NODE_ENV || 'Stokenet'; // Default to 'development' if NODE_ENV is not set
console.log("environment : ", environment)
// Define constants based on the environment
let dAppId, networkId;

if (environment === 'production') {
  dAppId = config.dapp_id!
  networkId = RadixNetwork.Mainnet;
} else {
  // Default to Stokenet configuration
  dAppId = config.dapp_id!
  networkId = RadixNetwork.Stokenet;
}

// Instantiate DappToolkit
export const rdt = RadixDappToolkit({
  dAppDefinitionAddress: dAppId,
  networkId: networkId,
  applicationName: 'Lending dApp',
  applicationVersion: '1.0.0',
});
console.log("dApp Toolkit: ", rdt);

// export const walletDataStore = writable<WalletData | undefined>(undefined);
// export const dAppToolkit = writable<RadixDappToolkit | undefined>(undefined);
