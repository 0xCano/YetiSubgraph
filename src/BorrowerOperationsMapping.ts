import { TroveManager } from '../generated/TroveManager/TroveManager'
import { newTrove, updatedTrove, tvl, YUSDPaid, global, VariablePaid, collateral} from '../generated/schema'
import { Address, ethereum, Bytes, BigDecimal, ByteArray, bigInt, BigInt} from '@graphprotocol/graph-ts'
import { ActivePool } from '../generated/BorrowerOperations/ActivePool'
import { YetiController } from '../generated/BorrowerOperations/YetiController'
import {YetiVaultToken} from '../generated/BorrowerOperations/YetiVaultToken'
import {TroveCreated, TroveUpdated, YUSDBorrowingFeePaid, VariableFeePaid, BorrowerOperations} from "../generated/BorrowerOperations/BorrowerOperations"
//import { parseContractABI, decodeTransactionDataProcessor } from "eth-data-decoder"

function addressToBytes(address: Address): Bytes {
  return Bytes.fromHexString(address.toHexString())
}

var BorrowerOperation = ["openTrove", "closeTrove", "adjustTrove"]

// const contractABIString = BorrowerOperations
// export const contractABI = parseContractABI(contractABIString);
// export const decoder = decodeTransactionDataProcessor(contractABI);

export function getTxnInputDataToDecode(event: ethereum.Event): Bytes {
  const inputDataHexString = event.transaction.input.toHexString().slice(10); //take away function signature: '0x????????'
  const hexStringToDecode = '0x0000000000000000000000000000000000000000000000000000000000000020' + inputDataHexString; // prepend tuple offset
  return Bytes.fromByteArray(Bytes.fromHexString(hexStringToDecode));
}

export function handleTroveCreated(event: TroveCreated): void {
  let trove = new newTrove(event.transaction.hash.toHex())
  trove.borrower = event.params._borrower
  trove.arrayIndex = event.params.arrayIndex
  trove.transaction = event.transaction.hash
  trove.timestamp = event.block.timestamp
  trove.save()
}

// export function updateTVLSingle(coll: Bytes, amount: BigInt, isIncrease: boolean, event: ethereum.Event): void {
//   // if (!isIncrease) {
//   //   amount = amount.times(new BigInt(-1))
//   // }
//   let newTVL = amount
//   let col = collateral.load(coll.toHex())
//   if (col != null) {
//     if (isIncrease) {
//       let tvlUpdate = new TVLIncrease(event.transaction.hash.toHex())
//       newTVL = col.tvl.plus(amount)
//       tvlUpdate.collateral = coll
//       tvlUpdate.amount = newTVL
//       tvlUpdate.transaction = event.transaction.hash
//       tvlUpdate.timestamp = event.block.timestamp
//       tvlUpdate.blockNum = event.block.number
//       let vault = VaultOracle.bind(Address.fromString("0x842f61Bea5Ba9A7a74f252EaeA2b4Fa2F91F250e".toLowerCase()))
//       let call = vault.try_underlyingPerReceipt()
//       if (call.reverted) {
//         tvlUpdate.underlying = BigDecimal.zero()
//       } else {
//         tvlUpdate.underlying = call.value
//       }
//       tvlUpdate.save()
//     } else {
//       let tvlUpdate= new TVLDecrease(event.transaction.hash.toHex())
//       tvlUpdate.collateral = coll
//       tvlUpdate.amount = newTVL
//       tvlUpdate.transaction = event.transaction.hash
//       tvlUpdate.timestamp = event.block.timestamp
//       tvlUpdate.blockNum = event.block.number
//       tvlUpdate.save()
//     }
//     col.save()
//   }
// }

// export function updateTVL(collsIn: Bytes[], amountsIn: BigInt[], collsOut: Bytes[], amountsOut: BigInt[], event: ethereum.Event): void {
//   for (let i = 0; i < collsIn.length; i++) {
//     updateTVLSingle(collsIn[i], amountsIn[i], true, event)
//   }
//   for (let j = 0; j < collsOut.length; j++) {
//     updateTVLSingle(collsOut[j], amountsOut[j], false, event)
//   }
// }

export function getUnderlyingPerReceipt(token: Address): BigDecimal {
  let contract = YetiVaultToken.bind(token)
  let call = contract.try_underlyingPerReceipt()
  if (!call.reverted) {
    return new BigDecimal(call.value).div(new BigDecimal(BigInt.fromString("10").pow(18)))
  }
  return BigDecimal.fromString("1")
}

export function getUnderlyingDecimal(token: Address): BigInt {
  let contract = YetiVaultToken.bind(token)
  let call = contract.try_underlyingDecimal()
  if (!call.reverted) {
    return call.value
  }
  return BigInt.fromString("18")
}

export function getPrice(token: Address): BigDecimal {
  let controller = YetiController.bind(Address.fromString("0xcCCCcCccCCCc053fD8D1fF275Da4183c2954dBe3".toLowerCase()))
  let call = controller.try_getPrice(token)
  if (!call.reverted) {
      return new BigDecimal(call.value).div(new BigDecimal(BigInt.fromString("10").pow(18)))
  }
  return BigDecimal.zero()
}

export function getRealAmounts(amounts: BigInt[], tokens: Bytes[]): BigDecimal[] {
  let addresses = tokens.map<Address>((token) => Address.fromBytes(token))
  let realAmounts: BigDecimal[] = []
  for (let i = 0; i < addresses.length; i++) {
    realAmounts.push(getRealAmountSingle(amounts[i], addresses[i]))
  }
  return realAmounts
}

export function getRealAmountSingle(amount: BigInt, token: Address): BigDecimal {
  let decimals = getUnderlyingDecimal(token)
  let realAmount = new BigDecimal(amount).div(new BigDecimal(BigInt.fromString("10").pow(ByteArray.fromBigInt(decimals)[0])))
  return realAmount
}

export function getValues(amounts: BigDecimal[], tokens: Bytes[]): BigDecimal[] {
  let addresses = tokens.map<Address>((token) => Address.fromBytes(token))
  let values: BigDecimal[] = []
  for (let i = 0; i < amounts.length; i++) {
    values.push(getValueSingle(amounts[i], addresses[i]))
  }
  return values
}

export function getValueSingle(amount: BigDecimal, token: Address): BigDecimal {
  let decimals = getUnderlyingDecimal(token)
  
  let underlying = getUnderlyingPerReceipt(token)
  let price = getPrice(token)
  if (["0xad69de0ce8ab50b729d3f798d7bc9ac7b4e79267", 
        "0xf311ff3277d42c354fe9d76d1e286736861844b5", 
        "0x0ad0bc8aa6c76b558ee471b7ad70ee7b65704e5d", 
        "0x6946b0527421b72df7a5f0c0c7a1474219684e8f", 
        "0xba9fb5adbaf7ad4ea7b6913a91c7e3196933fc09"]
        .includes(token.toString().toLowerCase())) {
          let power = 18 - ByteArray.fromBigInt(decimals)[0]
          let exp = new BigDecimal(BigInt.fromString("10").pow(ByteArray.fromI32(power)[0]))
          price = price.times(exp).div(underlying)
  }
  return amount.times(underlying).times(price)
}

export function sumValues(values: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.zero()
  for (let i = 0; i < values.length; i++) {
    sum = sum.plus(values[i])
  }
  return sum
}


export function handleTroveUpdated(event: TroveUpdated): void {
  let id = event.transaction.hash.toHex()
  let trove = updatedTrove.load(id)
  if (trove == null) {
    trove = new updatedTrove(id)
  } else {
    let contract = TroveManager.bind(Address.fromBytes(trove.eventAddress))
    trove.currentICR = contract.getCurrentICR(Address.fromBytes(event.params._borrower))
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
      
    const dataToDecode = getTxnInputDataToDecode(event)

    let operation = trove.operation

    if (operation == 'openTrove') {
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
          trove.length = t.length
          trove.temp = 'non-lever'
        }

    } else if (operation == 'openTroveLeverUp') {
        let decoded = ethereum.decode(
          '(uint256,uint256,address,address,address[],uint256[],uint256[],uint256[])',
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
          trove.leverages = t[6].toBigIntArray()
          trove.maxSlippages = t[7].toBigIntArray()
          trove.length = t.length
          trove.temp = 'non-lever'
        }
    } else if (operation == 'adjustTrove') {
        let decoded = ethereum.decode(
          '(address[],uint256[],address[],uint256[],uint256,bool,address,address,uint256)',
          dataToDecode
        );
        if (decoded != null) {
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
          trove.length = t.length
          trove.temp = 'non-lever'
      }
    } else if (operation == 'Add Coll Lever Up') {
        let decoded = ethereum.decode(
          '(address[],uint256[],uint256[],uint256[],uint256,address,address,uint256)',
          dataToDecode
        );
        if (decoded != null) {
          let t = decoded.toTuple();
          trove.collsIn = t[0].toAddressArray().map<Bytes>((token) => token)
          trove.amountsIn = t[1].toBigIntArray()
          trove.leverages = t[2].toBigIntArray()
          trove.maxSlippages = t[3].toBigIntArray()
          trove.YUSDchange = t[4].toBigInt()
          trove.upperHint = t[5].toAddress()
          trove.lowerHint = t[6].toAddress()
          trove.maxFeePercentage = t[7].toBigInt()
          trove.length = t.length
          trove.temp = 'lever'
      }
    } else if (operation == 'Withdraw Coll Unlever Up') {
        let decoded = ethereum.decode(
          '(address[],uint256[],uint256[],uint256,address,address)',
          dataToDecode
        );
        if (decoded != null) {
          let t = decoded.toTuple();
          trove.collsOut = t[0].toAddressArray().map<Bytes>((token) => token)
          trove.amountsOut = t[1].toBigIntArray()
          trove.maxSlippages = t[2].toBigIntArray()
          trove.YUSDchange = t[3].toBigInt()
          trove.upperHint = t[4].toAddress()
          trove.lowerHint = t[5].toAddress()
          trove.length = t.length
          trove.temp = 'lever'
        }
    } else if (operation == 'closeTroveUnlever') {
        let decoded = ethereum.decode(
          '(address[],uint256[],uint256[])',
          dataToDecode
        );
        if (decoded != null) {
          let t = decoded.toTuple();
          trove.collsOut = t[0].toAddressArray().map<Bytes>((token) => token)
          trove.amountsOut = t[1].toBigIntArray()
          trove.maxSlippages = t[2].toBigIntArray()
          trove.length = t.length
          trove.temp = 'lever'
        }
    }

    // updateTVL(trove.collsIn, trove.amountsIn, trove.collsOut, trove.amountsOut, event)
    trove.realAmountsIn = getRealAmounts(trove.amountsIn, trove.collsIn)
    trove.valuesIn = getValues(trove.realAmountsIn, trove.collsIn)
    trove.realAmountsOut = getRealAmounts(trove.amountsOut, trove.collsOut)
    trove.valuesOut = getValues(trove.realAmountsOut, trove.collsOut)
    trove.totalValue = sumValues(trove.values)
    trove.valueChange = sumValues(trove.valuesIn).minus(sumValues(trove.valuesOut))
    trove.save()
    updateTVL(event)
}


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


export function updateTVL (event: TroveUpdated): void {
  let globalInfo = global.load("only")
  let newGlobal = false
  if (globalInfo == null) {
    globalInfo = new global("only")
    newGlobal = true
    globalInfo.loaded = false
  } else {
    globalInfo.loaded = true
  }
  const oneHour = BigInt.fromString("3500")
  let newTimestamp = event.block.timestamp
  let gap = newTimestamp.minus(globalInfo.timestamp)
  if (newGlobal || gap.gt(oneHour)) {
    let pool = ActivePool.bind(Address.fromString("0xAAAaaAaaAaDd4AA719f0CF8889298D13dC819A15".toLowerCase()))
    let call = pool.try_getAllCollateral()
    if (!call.reverted) {
      let data = call.value
      let colls = data.value0
      let amounts = data.value1
      globalInfo.collaterals = colls.map<Bytes>((token) => token)
      globalInfo.amounts = amounts
      globalInfo.timestamp = event.block.timestamp
      let timestamps = globalInfo.timestamps
      timestamps.push(event.block.timestamp)
      globalInfo.timestamps = timestamps
      globalInfo.blockNum = event.block.number
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
        tvlUpdate.amount = amounts[i]
        let newAmounts = tvlUpdate.amounts
        newAmounts.push(amounts[i])
        tvlUpdate.amounts = newAmounts
        let newValue = price.times(amounts[i])
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
      globalInfo.save()
    }
  }
}

