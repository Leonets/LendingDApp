import { ResultAsync } from 'neverthrow'
import { deployPackage, loadBinaryFromPath, logger } from '../../helpers'
import { radixEngineClient } from '../../config'

import * as fs from 'fs';

const instantiateLendingDapp = (sugarOraclePackage: string, tokenSymbol: string) =>
  radixEngineClient
    .getManifestBuilder()
    .andThen(
      ({ wellKnownAddresses, convertStringManifest, submitTransaction }) =>
        convertStringManifest(`
        CALL_METHOD
            Address("${wellKnownAddresses.accountAddress}")
            "lock_fee"
            Decimal("10")
        ;
        CALL_FUNCTION
            Address("${sugarOraclePackage}")
            "ZeroCollateral"
            "instantiate"
            Decimal("5")
            Decimal("8")
            "${tokenSymbol}"
            Decimal("1728")
            "timebased"
            Decimal("2000")
        ;
        CALL_METHOD
            Address("${wellKnownAddresses.accountAddress}")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP")
        ;
        `)
          .andThen(submitTransaction)
          .andThen(({ txId }) =>
            radixEngineClient.gatewayClient
              .pollTransactionStatus(txId)
              .map(() => txId)
          )
          .andThen((txId) =>
            radixEngineClient.gatewayClient
              .getCommittedDetails(txId)
              // .map((res): string => res.createdEntities[0].entity_address)
              .map((res) => {
                const entities = res.createdEntities;
                const entityMap: Record<string, string> = {}; 

                entities.forEach((entity, index) => {
                    // entityMap[`entity_${index + 1}`] = entity.entity_address;
                    //TODO the next should create with the right keys
                    entityMap[predefinedKeys[index]] = entity.entity_address;
                });

                writeToPropertyFile(entityMap,"entities.properties");
                return entityMap;
            })
          )
    )

ResultAsync.combine([
  loadBinaryFromPath('/scrypto/target/wasm32-unknown-unknown/release/lending_dapp.wasm'),
  loadBinaryFromPath('/scrypto/target/wasm32-unknown-unknown/release/lending_dapp.rpd'),
])
  .andThen(([wasmBuffer, rpdBuffer]) =>
    deployPackage({ wasmBuffer, rpdBuffer, lockFee: 200 })
  )
  .andThen((result) => {
    logger.info('Deployed package', result)
    return instantiateLendingDapp(result.packageAddress, "LZU")
  })
  .mapErr((error) => {
    logger.error(error)
  })


  // // Example usage:
  const predefinedKeys = [
    "VITE_COMP_ADDRESS",
    "VITE_OWNER_BADGE",
    "VITE_ADMIN_BADGE",
    "VITE_STAFF_BADGE_ADDRESS",
    "VITE_BAD_PAYER_RESOURCE_ADDRESS",
    "VITE_LND_TOKEN_ADDRESS",
    "VITE_LND_RESOURCE_ADDRESS",
    "VITE_CREDITSCORE_RESOURCE_ADDRESS",
    "VITE_PT_RESOURCE_ADDRESS",
    "VITE_YT_RESOURCE_ADDRESS"
    ];


  const writeToPropertyFile = (entityMap: Record<string, string>, fileName: string) => {
    const lines: string[] = [];

    for (const key in entityMap) {
        if (entityMap.hasOwnProperty(key)) {
            const line = `${key}=${entityMap[key]}`;
            lines.push(line);
        }
    }

    try {
        fs.writeFileSync(fileName, lines.join('\n'));
        console.log(`Property file written to ${fileName}`);
    } catch (error) {
        console.error(`Error writing property file: ${error}`);
    }
};
