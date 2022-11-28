import { Liquidation, TroveUpdated } from "../generated/TroveManagerLiquidations/TroveManagerLiquidations"
import { newLiquidation, troveStatus, updatedTrove } from "../generated/schema"
import { Address, Bytes, BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { getRealAmounts, getValues, sumValues, updateTroveStatus } from "./utils"
import { TroveManager } from "../generated/TroveManager/TroveManager"

function addressToBytes(address: Address): Bytes {
    return Bytes.fromHexString(address.toHexString())
  }

var TroveManagerOperation = [
  "applyPendingRewards", "liquidateInNormalMode", 
  "liquidateInRecoveryMode", "redeemCollateral"]

// Mapping of Liquidation Event.
export function handleLiquidation(event: Liquidation): void {
    let id = event.block.transactionsRoot.toHex()
    let liquidation = new newLiquidation(id)
    liquidation.liquidatedAmount = event.params.liquidatedAmount
    liquidation.totalCollAmounts = event.params.totalCollAmounts
    liquidation.totalCollTokens = event.params.totalCollTokens.map<Bytes>((token) => {return addressToBytes(token)})
    liquidation.totalCollGasCompAmounts = event.params.totalCollGasCompAmounts
    liquidation.totalCollTokens = event.params.totalCollGasCompTokens.map<Bytes>((token) => {return addressToBytes(token)})
    liquidation.totalYUSDGasCompensation = event.params.totalYUSDGasCompensation
    liquidation.timestamp = event.block.timestamp
    liquidation.transaction = event.transaction.hash
    liquidation.blockNum = event.block.number
    liquidation.save()
  }

// Mapping of TroveUpdated Event from Liquidation.
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
  troveUpdate.operation = TroveManagerOperation[event.params.operation]
  troveUpdate.save()
}