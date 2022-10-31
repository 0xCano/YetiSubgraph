import {DefaultPoolBalancesUpdated} from "../generated/DefaultPool/DefaultPool"
import { tvl } from "../generated/schema"

export function handleBalancesUpdated(event: DefaultPoolBalancesUpdated): void {
    let colls = event.params._collaterals
    let amounts = event.params._amounts
    for (let i = 0; i < colls.length; i++) {
        let coll = colls[i]
        let tvlUpdate = tvl.load(coll.toHex())
        if (tvlUpdate == null) {
            tvlUpdate = new tvl(coll.toHex())
            tvlUpdate.collateral = coll
        }
        let newAmounts = tvlUpdate.amounts
        newAmounts.push(amounts[i])
        tvlUpdate.amounts = newAmounts
        let newTransactions = tvlUpdate.transactions
        newTransactions.push(event.transaction.hash)
        tvlUpdate.transactions = newTransactions
        let newTimestamps = tvlUpdate.timestamps
        newTimestamps.push(event.block.timestamp)
        tvlUpdate.timestamps = newTimestamps
        let newBlockNums = tvlUpdate.blockNums
        newBlockNums.push(event.block.number)
        tvlUpdate.blockNums = newBlockNums
        tvlUpdate.save()
    }
}