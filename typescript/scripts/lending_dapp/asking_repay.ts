import { config, radixEngineClient } from '../../config'
import { logger } from '../../helpers'

export const sendTransactionManifest = (lock_fee = 100) => {
  return radixEngineClient
    .getManifestBuilder()
    .andThen(({ wellKnownAddresses, convertStringManifest }) => {
      logger.info('Starting.... but not using this address', wellKnownAddresses)
      logger.info('lock_fee.... ', lock_fee)
      
      return convertStringManifest(`
          CALL_METHOD
              Address("${wellKnownAddresses.accountAddress}")
              "lock_fee"
              Decimal("10")
          ;      
          CALL_METHOD
              Address("${wellKnownAddresses.accountAddress}")
              "create_proof_of_amount"    
              Address("${config.owner_badge}")
              Decimal("1");
          CALL_METHOD
              Address("${config.component}")
              "asking_repay"
          ;
          CALL_METHOD
              Address("${wellKnownAddresses.accountAddress}")
              "try_deposit_batch_or_refund"
              Expression("ENTIRE_WORKTOP")
              Enum<0u8>()
          ;          
    `)
        .andThen(radixEngineClient.submitTransaction)
        .andThen(({ txId }) =>
          radixEngineClient.gatewayClient
            .pollTransactionStatus(txId)
            .map(() => txId)
        )
    })
}


sendTransactionManifest()
  .mapErr((error) => {
    logger.error('Error executing transaction:', error);
  });