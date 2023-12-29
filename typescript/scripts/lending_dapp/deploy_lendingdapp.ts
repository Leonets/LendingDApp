import { ResultAsync } from 'neverthrow'
import { deployPackage, loadBinaryFromPath, logger } from '../../helpers'
import { radixEngineClient } from '../../config'

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
            "LendingDApp"
            "instantiate_lending_dapp"
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
              .map((res): string => res.createdEntities[0].entity_address)
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
    return instantiateLendingDapp(result.packageAddress, "LENDAPP")
  })
  .mapErr((error) => {
    logger.error(error)
  })
