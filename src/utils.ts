import { Address, BigDecimal, BigInt, ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { ActivePool } from "../generated/BorrowerOperations/ActivePool";
import { YetiController } from "../generated/BorrowerOperations/YetiController";
import { YetiVaultToken } from "../generated/BorrowerOperations/YetiVaultToken";
import { tvl, global, troveStatus, updatedTrove } from "../generated/schema";
import { TroveUpdated } from "../generated/TroveManager/TroveManager";


export function getTxnInputDataToDecode(event: ethereum.Event): Bytes {
    const inputDataHexString = event.transaction.input.toHexString().slice(10); //take away function signature: '0x????????'
    const hexStringToDecode = '0x0000000000000000000000000000000000000000000000000000000000000020' + inputDataHexString; // prepend tuple offset
    return Bytes.fromByteArray(Bytes.fromHexString(hexStringToDecode));
  }
  
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
  
  export function getRealAmounts(amounts: BigInt[], tokens: Bytes[], isAmountsIn: boolean = false): BigDecimal[] {
    let addresses = tokens.map<Address>((token) => Address.fromBytes(token))
    let realAmounts: BigDecimal[] = []
    for (let i = 0; i < addresses.length; i++) {
      realAmounts.push(getRealAmountSingle(amounts[i], addresses[i], isAmountsIn))
    }
    return realAmounts
  }
  
  export function getRealAmountSingle(amount: BigInt, token: Address, isAmountsIn: boolean = false): BigDecimal {
    let decimals = getUnderlyingDecimal(token)
    let realAmount = new BigDecimal(amount).div(new BigDecimal(BigInt.fromString("10").pow(ByteArray.fromBigInt(decimals)[0])))
    if (isAmountsIn) {
      return realAmount
    }
    let underlying = getUnderlyingPerReceipt(token)
    return realAmount.times(underlying)
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
  
    let price = getPrice(token)
    if (["0xad69de0ce8ab50b729d3f798d7bc9ac7b4e79267", 
          "0xf311ff3277d42c354fe9d76d1e286736861844b5", 
          "0x0ad0bc8aa6c76b558ee471b7ad70ee7b65704e5d", 
          "0x6946b0527421b72df7a5f0c0c7a1474219684e8f", 
          "0xba9fb5adbaf7ad4ea7b6913a91c7e3196933fc09"]
          .includes(token.toHexString().toLowerCase())) {
            let decimals = getUnderlyingDecimal(token)
            let underlying = getUnderlyingPerReceipt(token)
            let power = 18 - ByteArray.fromBigInt(decimals)[0]
            let exp = new BigDecimal(BigInt.fromString("10").pow(ByteArray.fromI32(power)[0]))
            price = price.div(exp).div(underlying)
    }
    return amount.times(price)
  }
  
  export function sumValues(values: BigDecimal[]): BigDecimal {
    let sum = BigDecimal.zero()
    for (let i = 0; i < values.length; i++) {
      sum = sum.plus(values[i])
    }
    return sum
  }

  export function updateTroveStatus(status: troveStatus, trove: updatedTrove): void {
      /**
       * Update troveStatus's data with the new updatedTrove event.
       */
    status.borrower = trove.borrower
    status.created = trove.blockNum
    status.tokens = trove.tokens
    status.amounts = trove.amounts
    status.realAmounts = trove.realAmounts
    status.save()
}


  export function globalUpdate (event: TroveUpdated): void {
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
  
  
