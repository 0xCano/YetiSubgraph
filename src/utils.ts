import { Address, BigDecimal, BigInt, ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { YetiController } from "../generated/BorrowerOperations/YetiController";
import { YetiVaultToken } from "../generated/BorrowerOperations/YetiVaultToken";
import { troveStatus, updatedTrove } from "../generated/schema";


// Parses input HexString from ethereum.Event to Bytes that are decodable.
export function getTxnInputDataToDecode(event: ethereum.Event): Bytes {
  const inputDataHexString = event.transaction.input.toHexString().slice(10); //take away function signature: '0x????????'
  const hexStringToDecode = '0x0000000000000000000000000000000000000000000000000000000000000020' + inputDataHexString; // prepend tuple offset
  return Bytes.fromByteArray(Bytes.fromHexString(hexStringToDecode));
}


// Get underlyingPerReceipt of a vault token from YetiVaultToken contract. 
// If not a vault token, return 1.
export function getUnderlyingPerReceipt(token: Address): BigDecimal {
  let contract = YetiVaultToken.bind(token)
  let call = contract.try_underlyingPerReceipt()
  if (!call.reverted) {
    return new BigDecimal(call.value).div(new BigDecimal(BigInt.fromString("10").pow(18)))
  }
  return BigDecimal.fromString("1")
}

// Get underlyingDecimal of a vault token YetiVaultToken contract.
// If not a vault token, return 18. 
export function getUnderlyingDecimal(token: Address): BigInt {
  let contract = YetiVaultToken.bind(token)
  let call = contract.try_underlyingDecimal()
  if (!call.reverted) {
    return call.value
  }
  return BigInt.fromString("18")
}

// Get price of a token from YetiController contract, divided by 10 ^ 18.
// If no token, return 0.
export function getPrice(token: Address): BigDecimal {
  let controller = YetiController.bind(Address.fromString("0xcCCCcCccCCCc053fD8D1fF275Da4183c2954dBe3".toLowerCase()))
  let call = controller.try_getPrice(token)
  if (!call.reverted) {
      return new BigDecimal(call.value).div(new BigDecimal(BigInt.fromString("10").pow(18)))
  }
  return BigDecimal.zero()
}


// Calculate real amount of a token.
// if amounts recorded in amountsIn params: 
//        realAmount = amount / 10 ^ decimals
// else:
//        realAmount = amount / 10 ^ decimals * underlyingPerReceipt
export function getRealAmountSingle(amount: BigInt, token: Address, isAmountsIn: boolean = false): BigDecimal {
  let decimals = getUnderlyingDecimal(token)
  let realAmount = new BigDecimal(amount).div(new BigDecimal(BigInt.fromString("10").pow(ByteArray.fromBigInt(decimals)[0])))
  if (isAmountsIn) {
    return realAmount
  }
  let underlying = getUnderlyingPerReceipt(token)
  return realAmount.times(underlying)
}

// Calculate real amount of all tokens in a list.
export function getRealAmounts(amounts: BigInt[], tokens: Bytes[], isAmountsIn: boolean = false): BigDecimal[] {
  let addresses = tokens.map<Address>((token) => Address.fromBytes(token))
  let realAmounts: BigDecimal[] = []
  for (let i = 0; i < addresses.length; i++) {
    realAmounts.push(getRealAmountSingle(amounts[i], addresses[i], isAmountsIn))
  }
  return realAmounts
}

// Get the dollar value of a given amount (realAmount) of a token.
// if token is aToken i.e. included in (aUSDC, aWAVAX, aWETH, aUSDT, aDAI):
//        value = amount * price / 10 ^ (18 - underlyingDecimal) / underlyingPerReceipt
// else:
//        value = amount * price
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

// Get value of all tokens in a list.
export function getValues(amounts: BigDecimal[], tokens: Bytes[]): BigDecimal[] {
  let addresses = tokens.map<Address>((token) => Address.fromBytes(token))
  let values: BigDecimal[] = []
  for (let i = 0; i < amounts.length; i++) {
    values.push(getValueSingle(amounts[i], addresses[i]))
  }
  return values
}


// Return sum of numbers in a list.
export function sumValues(values: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.zero()
  for (let i = 0; i < values.length; i++) {
    sum = sum.plus(values[i])
  }
  return sum
}


// Update troveStatus's data with the new updatedTrove event.
export function updateTroveStatus(status: troveStatus, trove: updatedTrove): void {       
  status.borrower = trove.borrower
  status.created = trove.blockNum
  status.tokens = trove.tokens
  status.amounts = trove.amounts
  status.realAmounts = trove.realAmounts
  status.save()
}
