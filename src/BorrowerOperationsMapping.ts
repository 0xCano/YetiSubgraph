import { TroveManager } from '../generated/TroveManager/TroveManager'
import { updatedTrove, YUSDPaid, VariablePaid, troveStatus} from '../generated/schema'
import { Address, ethereum, Bytes, BigInt} from '@graphprotocol/graph-ts'
import {TroveUpdated, YUSDBorrowingFeePaid, VariableFeePaid} from "../generated/BorrowerOperations/BorrowerOperations"
import { getRealAmounts, getValues, getTxnInputDataToDecode, sumValues, updateTroveStatus } from './utils'


var BorrowerOperation = ["openTrove", "closeTrove", "adjustTrove"]

// Mapping of TroveUpdated events. Calculations and conversions are done with functions on utils.ts.
export function handleTroveUpdated(event: TroveUpdated): void {
  let id = event.transaction.hash.toHex()
  let trove = updatedTrove.load(id)
  if (trove == null) {
    trove = new updatedTrove(id)
  }
    trove.borrower = event.params._borrower
    trove.debt = event.params._debt
    trove.amounts = event.params._amounts
    trove.tokens =  event.params._tokens.map<Bytes>((token) => token)
    trove.realAmounts = getRealAmounts(trove.amounts, trove.tokens)
    trove.values = getValues(trove.realAmounts, trove.tokens)
    trove.timestamp = event.block.timestamp
    trove.operation = BorrowerOperation[event.params.operation]
    trove.transaction = event.transaction.hash
    trove.blockNum = event.block.number
    
    // Decode raw input bits to input list.
    const dataToDecode = getTxnInputDataToDecode(event)

    let operation = trove.operation

    if (operation == 'openTrove') {
        let newStatus = new troveStatus(trove.borrower.toHex())
        updateTroveStatus(newStatus, trove)
        let decoded = ethereum.decode(
          '(uint256,uint256,address,address,address[],uint256[])',
          dataToDecode
        );
        if (decoded != null) {
          let t = decoded.toTuple();
          trove.maxFeePercentage = t[0].toBigInt()
          trove.YUSDchange = t[1].toBigInt()
          trove.upperHint = t[2].toAddress()
          trove.lowerHint = t[3].toAddress()
          trove.collsIn = t[4].toAddressArray().map<Bytes>((token) => token)
          trove.amountsIn = t[5].toBigIntArray()
        }

    } else if (operation == 'adjustTrove') {
        let decoded = ethereum.decode(
          '(address[],uint256[],address[],uint256[],uint256,bool,address,address,uint256)',
          dataToDecode
        );
        if (decoded != null) {
          let status = troveStatus.load(trove.borrower.toHex())
          if (status) {
            updateTroveStatus(status, trove)
          }
          let t = decoded.toTuple();
          trove.collsIn = t[0].toAddressArray().map<Bytes>((token) => token)
          trove.amountsIn = t[1].toBigIntArray()
          trove.collsOut = t[2].toAddressArray().map<Bytes>((token) => token)
          trove.amountsOut = t[3].toBigIntArray()
          trove.YUSDchange = t[4].toBigInt()
          trove.isDebtIncrease = t[5].toBoolean()
          trove.upperHint = t[6].toAddress()
          trove.lowerHint = t[7].toAddress()
          trove.maxFeePercentage = t[8].toBigInt()
      }
    }
    if (trove.debt.gt(BigInt.zero())) {
      let contract = TroveManager.bind(Address.fromString("0x000000000000614c27530d24B5f039EC15A61d8d".toLowerCase()))
      trove.currentICR = contract.getCurrentICR(Address.fromBytes(event.params._borrower))
    }
    trove.realAmountsIn = getRealAmounts(trove.amountsIn, trove.collsIn, true)
    trove.valuesIn = getValues(trove.realAmountsIn, trove.collsIn)
    trove.realAmountsOut = getRealAmounts(trove.amountsOut, trove.collsOut)
    trove.valuesOut = getValues(trove.realAmountsOut, trove.collsOut)
    trove.totalValue = sumValues(trove.values)
    trove.valueChange = sumValues(trove.valuesIn).minus(sumValues(trove.valuesOut))  
    trove.save()
}


// Mapping of YUSDBorrowingFeePaid Event.
export function handleYUSDPaid(event: YUSDBorrowingFeePaid): void {
  let id = event.transaction.hash.toHex()
  let yusdPaid =  new YUSDPaid(id)
  yusdPaid.borrower = event.params._borrower
  yusdPaid.fee = event.params._YUSDFee
  let trove = updatedTrove.load(id)
  if (trove && trove.operation == 'openTrove') {
    let variablePaid = VariablePaid.load(id)
    if (variablePaid) {
      const fee = event.params._YUSDFee.minus(variablePaid.fee)
      yusdPaid.fee = fee
    }
  }
  yusdPaid.transaction = event.transaction.hash
  yusdPaid.blockNum = event.block.number
  yusdPaid.timestamp = event.block.timestamp
  yusdPaid.save()
}

// Mapping of VariableFeePaid Event.
export function handleVariablePaid(event: VariableFeePaid): void {
  let id = event.transaction.hash.toHex()
  let variablePaid =  new VariablePaid(id)
  variablePaid.borrower = event.params._borrower
  variablePaid.fee = event.params._YUSDVariableFee
  let trove = updatedTrove.load(id)
  if (trove && trove.operation == 'openTrove') {
    let yusdPaid = YUSDPaid.load(id)
    if (yusdPaid) {
      const fee = yusdPaid.fee.minus(event.params._YUSDVariableFee)
      yusdPaid.fee = fee
      yusdPaid.save()
    }
  }
  variablePaid.transaction = event.transaction.hash
  variablePaid.blockNum = event.block.number
  variablePaid.timestamp = event.block.timestamp
  variablePaid.save()
}