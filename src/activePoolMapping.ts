import {ActivePoolBalancesUpdated, ActivePoolBalanceUpdated} from "../generated/ActivePool/ActivePool"
import { tvl } from "../generated/schema"
import { YetiController } from "../generated/YetiController/YetiController"
import { Address, BigInt } from "@graphprotocol/graph-ts"

export function handleBalancesUpdated(event: ActivePoolBalancesUpdated): void {
    let colls = event.params._collaterals
    let amounts = event.params._amounts
    for (let i = 0; i < colls.length; i++) {
        let coll = colls[i]
        let tvlUpdate = tvl.load(coll.toHex())
        if (tvlUpdate == null) {
            tvlUpdate = new tvl(coll.toHex())
            tvlUpdate.collateral = coll
        }
        let controller = YetiController.bind(Address.fromString("0xcCCCcCccCCCc053fD8D1fF275Da4183c2954dBe3".toLowerCase()))
        let call = controller.try_getPrice(coll)
        let price = BigInt.zero()
        if (!call.reverted) {
            price = call.value
        }
        let newPrices = tvlUpdate.prices
        newPrices.push(price)
        tvlUpdate.prices = newPrices
        let newAmount = tvlUpdate.amount.plus(amounts[i])
        tvlUpdate.amount = newAmount
        let newAmounts = tvlUpdate.amounts
        newAmounts.push(newAmount)
        tvlUpdate.amounts = newAmounts
        let newValue = tvlUpdate.value.plus(price.times(newAmount))
        tvlUpdate.value = newValue
        let newValues = tvlUpdate.values
        newValues.push(newValue)
        tvlUpdate.values = newValues
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

  export function handleBalanceUpdated(event: ActivePoolBalanceUpdated): void {
    let coll = event.params._collateral
    let tvlUpdate = tvl.load(coll.toHex())
    if (tvlUpdate == null) {
        tvlUpdate = new tvl(coll.toHex())
        tvlUpdate.collateral = coll
    }
    let controller = YetiController.bind(Address.fromString("0xcCCCcCccCCCc053fD8D1fF275Da4183c2954dBe3".toLowerCase()))
    let call = controller.try_getPrice(coll)
    let price = BigInt.zero()
    if (!call.reverted) {
        price = call.value
    }
    let newPrices = tvlUpdate.prices
    newPrices.push(price)
    tvlUpdate.prices = newPrices
    let newAmount = tvlUpdate.amount.minus(event.params._amount)
    tvlUpdate.amount = newAmount
    let newAmounts = tvlUpdate.amounts
    newAmounts.push(newAmount)
    tvlUpdate.amounts = newAmounts
    let newValue = tvlUpdate.value.minus(price.times(newAmount))
    tvlUpdate.value = newValue
    let newValues = tvlUpdate.values
    newValues.push(newValue)
    tvlUpdate.values = newValues
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