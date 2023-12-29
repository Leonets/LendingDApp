import { radixEngineClient } from '../../config'
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
              Address("resource_tdx_2_1t542hvj28mgl6wggrltfl0k7pfq9h0hzlywvrq4y75gvpx46kv5mud")
              Decimal("1");
          CALL_METHOD
              Address("component_tdx_2_1cpc7lq4d0yzly0htf2na98xrkp5wvrtps32f9mnftk0qtayzljff5n")
              "extend_lending_pool"
              Decimal("50")
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