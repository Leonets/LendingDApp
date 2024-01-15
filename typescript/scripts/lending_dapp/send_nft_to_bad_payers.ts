import { config, radixEngineClient } from '../../config'
import { logger } from '../../helpers'

export const sendTransactionManifest = (lock_fee = 100) => {
  return radixEngineClient
    .getManifestBuilder()
    .andThen(({ wellKnownAddresses, convertStringManifest }) => {
      logger.info('Starting.... but not using this address', wellKnownAddresses)
      logger.info('lock_fee.... ', lock_fee)

      let amountPerRecipient = 1;
      let amount = 3;
      let resourceAddress = config.bad_payer;
  
      // Define the data to be sent in the POST request.
      const requestData = generatePayload("ComponentConfig", "", "Global");
  
      // Make an HTTP POST request to the gateway
      fetch('https://stokenet.radixdlt.com/state/entity/details', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: requestData,
      })
      .then(response => response.json()) // Assuming the response is JSON data.
      .then(data => { 
        const json = data.items ? data.items[0] : null;
        //get open borrowing
        const openBorrowing = getLateBorrowers(json);
        console.log("[admin] fetch openBorrowing:", openBorrowing.length);
        let amount = openBorrowing.length;
        let depositToRecipients = openBorrowing
          .map((recipientAddress, index) => `
            TAKE_FROM_WORKTOP
                Address("${resourceAddress}")
                Decimal("${amountPerRecipient}")
                Bucket("bucket_${index}")
            ;
            CALL_METHOD
                Address("${recipientAddress}")
                "try_deposit_or_abort"
                Bucket("bucket_${index}")
                Enum<0u8>()
            ;`)
          .join('');
          const transactionManifest = `
            CALL_METHOD
              Address("${config.smart_contract_owner_address}")
              "withdraw"
              Address("${resourceAddress}")
              Decimal("${amount}")
          ;
            ${depositToRecipients}`;
      
          console.log(`transactionManifest = `,    transactionManifest);
      
      return convertStringManifest(transactionManifest)
        .andThen(radixEngineClient.submitTransaction)
        .andThen(({ txId }) =>
          radixEngineClient.gatewayClient
            .pollTransactionStatus(txId)
            .map(() => txId)
        )
    })
  })
}


sendTransactionManifest()
  .mapErr((error) => {
    logger.error('Error executing transaction:', error);
  });


// ************ Utility Function (Gateway) *****************
function generatePayload(method, address, type) {
  let code;
  switch (method) {
    case 'ComponentConfig':
      code = `{
        "addresses": [
          "${config.component}"
        ],
        "aggregation_level": "Global",
        "opt_ins": {
          "ancestor_identities": true,
          "component_royalty_vault_balance": true,
          "package_royalty_vault_balance": true,
          "non_fungible_include_nfids": true,
          "explicit_metadata": [
            "name",
            "description"
          ]
        }
      }`;
    break;
    // Add more cases as needed
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  return code;
}

// ************ Utility Function (Gateway) *****************
function getLateBorrowers(data) {
  const latePayersAccountsField = data.details.state.fields.find(field => field.field_name === "late_payers_accounts");
  console.log("late_payers_accounts:", latePayersAccountsField);

  // Check if the "late_payers_accounts" field exists
  if (latePayersAccountsField) {
    // Assuming each element is a Tuple with "fields" property
    const rootFields = latePayersAccountsField.elements.map(element => {
      // Assuming each element has "fields" property
      return element;
    });
    console.log("rootFields:", rootFields);

    // Check if the "rootFields" array is not empty
    if (rootFields.length > 0) {
      // Assuming each "fields" has an array of items with a "value" field
      const elementsFieldsArray = rootFields
        .flatMap(item => item) // Flatten the array of arrays
        .map(innerItem => innerItem.value);

      // Return the extracted values
      return elementsFieldsArray;
    }
  }
}

// *** NOT USED ***
function getData(method, address, type) {
  // Define the data to be sent in the POST request.
  const requestData = generatePayload("ComponentConfig", "", "Global");

  // Make an HTTP POST request to the gateway
  return fetch('https://stokenet.radixdlt.com/state/entity/details', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: requestData,
  })
  .then(response => response.json()) // Assuming the response is JSON data.
  .then(data => { 
    const json = data.items ? data.items[0] : null;
    //get open borrowing
    const openBorrowing = getLateBorrowers(json);
    return openBorrowing;
  }
)
}