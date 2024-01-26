import { config, radixEngineClient } from '../../config'
import { logger } from '../../helpers'
import { RadixDappToolkit, RadixNetwork } from '@radixdlt/radix-dapp-toolkit'
import type {
  StateNonFungibleLocationResponseItem
} from '@radixdlt/radix-dapp-toolkit';
// import { writable } from 'svelte/store';

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

export const sendTransactionManifest = (lock_fee = 100) => {

  let resourceAddress = config.bad_payer!;
  let admin_badge = config.owner_badge!;
  let accountAddress = config.smart_contract_owner_address!;

  let nftHoldersPromise = fetchDataAndNftId(resourceAddress);
    nftHoldersPromise.then(firstResult => {
      let nftHolders = firstResult;
      // Now you can work with the result
      const nftsToRecall = nftHolders.map((item) => ({
        vaultAddress: item.vaultAddresses,
        nftId: item.nonFungibleId
      }));

      //quick way to exclude the owner address, otherwise it moves the nft from the same address
      const excludedVaultAddress = "internal_vault_tdx_2_1nqu5yae8d5lxrul4k0ydukj3nu6lmsnnuajdehvfg5rfj8xxftcqc3";
      
      const recallNfts = nftsToRecall
        .filter(({ vaultAddress }) => vaultAddress !== excludedVaultAddress)
        .map(
          ({ vaultAddress, nftId: nftId }) => `
          RECALL_NON_FUNGIBLES_FROM_VAULT 
              Address("${vaultAddress}") 
              Array<NonFungibleLocalId>(
                  NonFungibleLocalId("${nftId}"),
              )
          ;
          `
        )
        .join('');
    
      const NonFungibleLocalIds = nftsToRecall
        .filter(({ vaultAddress }) => vaultAddress !== excludedVaultAddress)
        .map(({ nftId: nftId }) => `NonFungibleLocalId("${nftId}")`)
        .join(', ');
    
      let transactionManifest =  `
        CALL_METHOD
            Address("${accountAddress}")
            "create_proof_of_amount"
            Address("${admin_badge}")
            Decimal("1");
        ${recallNfts}
        TAKE_NON_FUNGIBLES_FROM_WORKTOP
            Address("${resourceAddress}")
            Array<NonFungibleLocalId>(
                ${NonFungibleLocalIds}
            )
            Bucket("bucket_of_bonds")
        ;
        CALL_METHOD
            Address("${accountAddress}")
            "try_deposit_or_abort"
            Bucket("bucket_of_bonds")
            Enum<0u8>()
        ;`;
      console.log(`transactionManifest = `,    transactionManifest);

      return radixEngineClient
        .getManifestBuilder()
        .andThen(({ wellKnownAddresses, convertStringManifest }) => {
          logger.info('Starting.... but not using this address', wellKnownAddresses)
          logger.info('lock_fee.... ', lock_fee)
          

              console.info("[admin] Tx :", transactionManifest);
              return convertStringManifest(transactionManifest)
                .andThen(radixEngineClient.submitTransaction)
                .andThen(({ txId }) =>
                  radixEngineClient.gatewayClient
                    .pollTransactionStatus(txId)
                    .map(() => txId)
            )
      })
      
      //TODO se scommento non funziona perchè transactionManifest è un Promise
      //se commento non va bene in alto perchè vede il risultato come void
      // Type 'void' is not assignable to type 'ResultAsync<unknown, unknown> | Result<unknown, unknown>'
      // return convertStringManifest(transactionManifest)
      //   .andThen(radixEngineClient.submitTransaction)
      //   .andThen(({ txId }) =>
      //     radixEngineClient.gatewayClient
      //       .pollTransactionStatus(txId)
      //       .map(() => txId)
      //   )
    })

  
}


sendTransactionManifest()
  // .mapErr((error) => {
  //   logger.error('Error executing transaction:', error);
  // });


//UTILITY

function fetchDataAndNftId(selectedNfResource: string) {
  let selectedFromAccount = 'idontknow';
  return rdt?.gatewayApi.state
        .getNonFungibleIds(selectedNfResource)
        .then(({ items: ids }) => {
          return rdt?.gatewayApi.state
            .getNonFungibleLocation(selectedNfResource, ids)
            .then((locationResponse) => {
              const vaultAddresses = locationResponse
                .map((item) => item.owning_vault_address)
                .filter((item): item is string => !!item);

              const locationMap = locationResponse.reduce((acc, item, _index) => {
                if (item.owning_vault_address) {
                  if (acc[item.owning_vault_address]) acc[item.owning_vault_address].push(item);
                  else acc[item.owning_vault_address] = [item];
                }
                return acc;
              }, {} as Record<string, StateNonFungibleLocationResponseItem[]>);

              return rdt.gatewayApi.state
                .getEntityDetailsVaultAggregated(vaultAddresses, {
                  ancestorIdentities: true
                })
                .then((entityDetailResponse) => {
                  return entityDetailResponse
                    .map((item) => {
                      const items = locationMap[item.address];

                      return items.map(({ non_fungible_id: nonFungibleId }) => ({
                        nonFungibleId,
                        vaultAddresses: item.address,
                        resourceAddress: selectedNfResource,
                        address: `${selectedNfResource}:${nonFungibleId}`,
                        holderAddress: item.ancestor_identities?.owner_address
                      }));
                    })
                    .flat(2);
                })
                .then((items) => {
                  return items.filter((item) => item.holderAddress !== selectedFromAccount);
                });
            });
        });
}