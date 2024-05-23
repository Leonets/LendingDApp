import { bufferToUnit8Array, getOwnerBadge, hash } from '.'
import { radixEngineClient } from '../config'


// Address("${wellKnownAddresses.accountAddress}")

export const deployPackage = ({
  wasmBuffer,
  rpdBuffer,
  lockFee,
}: {
  wasmBuffer: Buffer
  rpdBuffer: Buffer
  lockFee: number
}) =>
  radixEngineClient
    .getManifestBuilder()
    .andThen((engineToolkit) =>
      radixEngineClient.decodeSbor(rpdBuffer).map((rpdDecoded) => ({
        wasmBuffer,
        rpdBuffer,
        rpdDecoded,
        ...engineToolkit,
      }))
    )
    .andThen(
      ({
        wasmBuffer,
        rpdDecoded,
        convertStringManifest,
        submitTransaction,
        
      }) => {
        const wasmHash = hash(wasmBuffer).toString('hex')

        return convertStringManifest(`
          CALL_METHOD
            Address("account_tdx_2_12y07tt00flw9x4ndw2z4e29z2cwuwz4ptlq3tpekxf6jmhlnj402es")
            "lock_fee"
            Decimal("${lockFee}")
          ;

          PUBLISH_PACKAGE
            ${rpdDecoded}
            Blob("${wasmHash}") 
            Map<String, Tuple>()  
          ;
          
          CALL_METHOD
            Address("account_tdx_2_12y07tt00flw9x4ndw2z4e29z2cwuwz4ptlq3tpekxf6jmhlnj402es")
            "deposit_batch"
            Expression("ENTIRE_WORKTOP")
          ;
    `)
          .andThen(({ instructions }) =>
            submitTransaction({
              instructions,
              blobs: [bufferToUnit8Array(wasmBuffer)],
            })
          )
          .andThen(({ txId }) =>
            radixEngineClient.gatewayClient
              .pollTransactionStatus(txId)
              .map(() => txId)
          )
          .andThen((txId) =>
            radixEngineClient.gatewayClient
              .getCommittedDetails(txId)
              .map((res) => ({
                packageAddress: res.createdEntities[0].entity_address,
                ...getOwnerBadge(res.events),
              }))
          )
      }
    )
