# Yeti Finance Subgraph

Subgrah for Yeti Finance. Used in **Transaction History**. Converts events on Avalanche to Graph Nodes that can be fetched through the Graph API. Read [Creating a Subgraph](https://thegraph.com/docs/en/developing/creating-a-subgraph/) for detailed information about subgraphs.

## Adding events to handle

1. Create a corresponding type in `schema.graphql`.
2. Add the contract abi (proxy) to the `abis` folder.
3. Run `yarn codegen`. 
4. Create a mapping file such as `BorrowerOperationMapping.ts`.
5. Create a eventHandler function in the mapping file i.e, `handleTroveUpdated`.
6. Add the information about the contract and event handling to `subgraph.yaml`.

## Example event handling

```
export function handleRedemption(event: Redemption): void {
  let id = event.transaction.hash.toHex()
  let redemption = newRedemption.load(id)
  if (redemption == null) {
      redemption = new newRedemption(id)
  }
  redemption.attemptedYUSDAmount = event.params._attemptedYUSDAmount
  redemption.YUSDPaid = event.params.YUSDfee
  redemption.actualYUSDAmount = event.params._actualYUSDAmount
  redemption.tokens = event.params.tokens.map<Bytes>((token) => token)
  redemption.amounts = event.params.amounts
  redemption.transaction = event.transaction.hash
  redemption.blockNum = event.block.number
  redemption.timestamp = event.block.timestamp
  redemption.save()
}
```

As shown above, a conventional event handling either loads a graph node or creates a new one, then maps event parameters to the node parameters and save it.

## Binding 

```
import { TroveManager } from '../generated/TroveManager/TroveManager'
```

```
  if (troveUpdate.debt.gt(BigInt.zero())) {
    let contract = TroveManager.bind(Address.fromString("0x000000000000614c27530d24B5f039EC15A61d8d".toLowerCase()))
    troveUpdate.currentICR = contract.getCurrentICR(Address.fromBytes(troveUpdate.borrower))
  }
```

After adding ABI of a contract, including it in the manifest and running `yarn codegen`, each contract can be accessed as an object in the mapping files. Then as shown above, use the format `[contract name].bind(Address.fromString("(contract address)".toLowerCase()))` to "bind" or generate a state of the contract at the time of the event that is being handled, and call any view functions. This is a powerful tool that is used across the Subgraph.



## Updating the Subgraph

1. Make sure the authentications are correct (contact Yeti Finance for more details). 
2. Run `yarn codegen`.
3. Run graph deploy --product hosted-service 0xcano/yeti

## Querying the Subgraph

1. Use The Graph web engine to test out a few queries. Link for this subgraph [here](https://thegraph.com/hosted-service/subgraph/0xcano/yeti)
2. On the website, there is a api URL under `QUERIES (HTTP)`. Use this URL in the frontend to make queries in GraphQL.
3. While the Subgraph is loading, press the `Current Version` dropdown and navigate to `Pending Version`. A separate URL will be given temporarily to utilize the loading Subgraph. Once it finishes loading, the main URL will now lead to it and the temporary URL will no longer be valid. 

## Usage in Yeti Finance

This subgraph stores each transaction history ever made, using the correct calculations to store dollar values of collaterals and their amounts. When it is used with queries like

```
query {
        updatedTroves(where: {borrower: "${userID}"}, orderBy: timestamp, orderDirection: desc) {
          timestamp
          operation
          currentICR
          tokens
          amounts
          totalValue
          valueChange
          isDebtIncrease
          blockNum
          transaction
        }
      }
```

it effectively provides all nodes that store historical transaction data made by the given user. Each eventhandling contributes


