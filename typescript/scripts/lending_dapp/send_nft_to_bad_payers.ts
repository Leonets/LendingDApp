import { config, radixEngineClient } from '../../config'
import { logger } from '../../helpers'

export const sendTransactionManifest = () => {
  let amountPerRecipient = 1;
  let resourceAddress = config.bad_payer;

  // Define the data to be sent in the POST request.
  const requestData = generatePayload("ComponentConfig");

  // Make an HTTP POST request to the gateway
  return fetch('https://stokenet.radixdlt.com/state/entity/details', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: requestData,
  })
  .then(response => response.json() as Promise<{ items?: any[] }>) // Assuming the response is JSON data.
  .then(data => { 
    const json = data.items ? data.items[0] : null;
    //get open borrowing
    const openBorrowing = getLateBorrowers(json);
    console.log("[admin] fetch openBorrowing:", openBorrowing!.length);
    let amount = openBorrowing!.length;
    let depositToRecipients = openBorrowing!
      .map((recipientAddress: any, index: any) => `
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
          "lock_fee"
          Decimal("10")
        ;      
        CALL_METHOD
          Address("${config.smart_contract_owner_address}")
          "withdraw"
          Address("${resourceAddress}")
          Decimal("${amount}")
       ;
        ${depositToRecipients}`;
  
        console.log(`transactionManifest = `,    transactionManifest);
      console.log(`depositToRecipients = `,    depositToRecipients);
    
    return radixEngineClient
      .getManifestBuilder()
      .andThen(({ convertStringManifest }) => {
        logger.info('Starting.... ')

        return convertStringManifest(transactionManifest)
          .andThen(radixEngineClient.submitTransaction)
          .andThen(({ txId }) =>
            {
              return radixEngineClient.gatewayClient
              .pollTransactionStatus(txId)
              .map(() => txId)
              .mapErr((error) => {
                logger.error('Error executing transaction:', error);
              });
            }
          )
      })
    })
}


sendTransactionManifest()
  // .mapErr((error) => {
  //   logger.error('Error executing transaction:', error);
  // });


// ************ Utility Function (Gateway) *****************
function generatePayload(method: string) {
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
interface Field {
  field_name: string;
  elements: Element[];
}
interface Element {
  kind: string;
  value: string; // Adjust the type of 'value' according to your actual data structure
}

// Your function with type annotations
function getLateBorrowers(data: { details: { state: { fields: Field[] } } }) {
  const latePayersAccountsField = data.details.state.fields.find(field => field.field_name === "late_payers_accounts");

  // Check if the "late_payers_accounts" field exists
  if (latePayersAccountsField) {
    console.log('late late_payers_accounts', latePayersAccountsField);
    // Assuming each element is an object with a "fields" property
    const rootFields = latePayersAccountsField.elements.map((element: Element) => {
      // Accessing fields property of each element
      return element.value;
    });
    console.log('late borrowers', rootFields);

    // Flatten the array of arrays and extract the 'value' property
    const elementsFieldsArray = rootFields
      .flat() // Flatten the array of arrays
      .map(innerItem => innerItem);

    // Return the extracted values
    return elementsFieldsArray;
  }

  // Return a default value or undefined if no matching conditions are met
  return undefined;
}



// *** NOT USED ***
// function getData(method, address) {
//   // Define the data to be sent in the POST request.
//   const requestData = generatePayload("ComponentConfig", "", "Global");

//   // Make an HTTP POST request to the gateway
//   return fetch('https://stokenet.radixdlt.com/state/entity/details', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//     },
//     body: requestData,
//   })
//   .then(response => response.json()) // Assuming the response is JSON data.
//   .then(data => { 
//     const json = data.items ? data.items[0] : null;
//     //get open borrowing
//     const openBorrowing = getLateBorrowers(json);
//     return openBorrowing;
//   }
// )
// }