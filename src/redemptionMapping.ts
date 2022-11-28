import { TroveManager } from '../generated/TroveManager/TroveManager'
import { newRedemption, troveStatus, updatedTrove } from "../generated/schema"
import { Redemption } from "../generated/TroveManagerRedemptions/TroveManagerRedemptions"
import { TroveUpdated } from "../generated/TroveManager/TroveManager"
import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { getValues, getRealAmounts, sumValues, updateTroveStatus} from "./utils"

// Mapping of Redemption Event.
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

// Mapping of TroveUpdated Event from Redemption.
export function handleTroveUpdated(event: TroveUpdated): void {
  let id = event.transaction.hash.toHex().concat(event.params._borrower.toHex())
  let troveUpdate = updatedTrove.load(id)
  if (troveUpdate == null) {
    troveUpdate = new updatedTrove(id)
  }
  troveUpdate.borrower = event.params._borrower
  troveUpdate.debt = event.params._debt
  if (troveUpdate.debt.gt(BigInt.zero())) {
    let contract = TroveManager.bind(Address.fromString("0x000000000000614c27530d24B5f039EC15A61d8d".toLowerCase()))
    troveUpdate.currentICR = contract.getCurrentICR(Address.fromBytes(troveUpdate.borrower))
  }
  troveUpdate.tokens = event.params._tokens.map<Bytes>((token) => token)
  troveUpdate.amounts = event.params._amounts
  troveUpdate.realAmounts = getRealAmounts(troveUpdate.amounts, troveUpdate.tokens)
  troveUpdate.values = getValues(troveUpdate.realAmounts, troveUpdate.tokens)
  troveUpdate.totalValue = sumValues(troveUpdate.values)
  /**
   * Take the most recent trove Status and calculate the difference.
   * This is necessary because the TroveUpdate event does not
   * emit information about collsOut and amountsOut.
   */
  let status = troveStatus.load(troveUpdate.borrower.toHex())
  let collsOut :Bytes[] = []
  let amountsOut :BigInt[] = []
  if (status != null) {
    for (let i = 0; i < status.tokens.length; i++) {
      let token = status.tokens[i]
      let prevAmount = status.amounts[i]
      if (!troveUpdate.tokens.includes(token)) {
        collsOut.push(token)
        amountsOut.push(prevAmount)
      } else {
          let newAmount = troveUpdate.amounts[troveUpdate.tokens.indexOf(token)]
          if (newAmount.lt(prevAmount)) {
            collsOut.push(token)
            amountsOut.push(prevAmount.minus(newAmount))
          }
      }
    }
    updateTroveStatus(status, troveUpdate)
  }
  troveUpdate.collsOut = collsOut
  troveUpdate.amountsOut = amountsOut
  troveUpdate.realAmountsOut = getRealAmounts(troveUpdate.amountsOut, troveUpdate.collsOut)
  troveUpdate.valuesOut = getValues(troveUpdate.realAmountsOut, troveUpdate.collsOut)
  troveUpdate.valueChange = BigDecimal.zero().minus(sumValues(troveUpdate.valuesOut))
  troveUpdate.transaction = event.transaction.hash
  troveUpdate.timestamp = event.block.timestamp
  troveUpdate.blockNum = event.block.number
  troveUpdate.operation = 'redeemCollateral'
  troveUpdate.save()

}