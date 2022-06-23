import { TroveManager } from '../generated/TroveManager/TroveManager'
import { newTrove, updatedTrove, YUSDPaid, VariablePaid} from '../generated/schema'
import { Address, ethereum, Bytes, ByteArray} from '@graphprotocol/graph-ts'
import {TroveCreated, TroveUpdated, YUSDBorrowingFeePaid, VariableFeePaid, BorrowerOperations} from "../generated/BorrowerOperations/BorrowerOperations"
//import { parseContractABI, decodeTransactionDataProcessor } from "eth-data-decoder"

function addressToBytes(address: Address): Bytes {
  return Bytes.fromHexString(address.toHexString())
}

var BorrowerOperation = ["openTrove", "closeTrove", "adjustTrove"]

// const contractABIString = BorrowerOperations
// export const contractABI = parseContractABI(contractABIString);
// export const decoder = decodeTransactionDataProcessor(contractABI);

export function handleTroveCreated(event: TroveCreated): void {
  let trove = new newTrove(event.block.hash.toHex())
  trove.borrower = event.params._borrower
  trove.arrayIndex = event.params.arrayIndex
  trove.transaction = event.transaction.hash
  trove.timestamp = event.block.timestamp
  trove.save()
}

export function handleTroveUpdated(event: TroveUpdated): void {
  let id = event.transaction.hash.toHex()
  let trove = updatedTrove.load(id)
  if (trove == null) {
    trove = new updatedTrove(id)
    trove.borrower = event.params._borrower
    trove.debt = event.params._debt
    trove.amounts = event.params._amounts
    trove.tokens =  event.params._tokens.map<Bytes>((token) => token)
    trove.timestamp = event.block.timestamp
    trove.operation = BorrowerOperation[event.params.operation]
    trove.transaction = event.transaction.hash
    trove.blockNum = event.block.number
    trove.save()
  } else {
    trove.borrower = event.params._borrower
    trove.debt = event.params._debt
    trove.amounts = event.params._amounts
    trove.tokens =  event.params._tokens.map<Bytes>((token) => token)
    trove.timestamp = event.block.timestamp
    trove.operation = BorrowerOperation[event.params.operation]
    trove.transaction = event.transaction.hash
    trove.blockNum = event.block.number
    let contract = TroveManager.bind(Address.fromBytes(trove.eventAddress))
    trove.currentICR = contract.getCurrentICR(Address.fromBytes(trove.borrower))
  }

    function getTxnInputDataToDecode(event: ethereum.Event): Bytes {
      const inputDataHexString = event.transaction.input.toHexString().slice(10); //take away function signature: '0x????????'
      const hexStringToDecode = '0x0000000000000000000000000000000000000000000000000000000000000020' + inputDataHexString; // prepend tuple offset
      return Bytes.fromByteArray(Bytes.fromHexString(hexStringToDecode));
  }

    const dataToDecode = getTxnInputDataToDecode(event)
    const decoded = ethereum.decode(
      '(address[],uint256[],address[],uint256[],uint256,bool,address,address,uint256)',
      dataToDecode
    );
    if (decoded != null) {
      const t = decoded.toTuple();
      trove.collsIn = t[0].toAddressArray().map<Bytes>((token) => token)
      trove.amountsIn = t[1].toBigIntArray()
      trove.collsOut = t[2].toAddressArray().map<Bytes>((token) => token)
      trove.amountsOut = t[3].toBigIntArray()
      trove.YUSDchange = t[4].toBigInt()
      trove.isDebtIncrease = t[5].toBoolean()
    }
    trove.save()
}



export function handleYUSDPaid(event: YUSDBorrowingFeePaid): void {
  let id = event.block.hash.toHex()
  let yusdPaid =  new YUSDPaid(id)
  yusdPaid.borrower = event.params._borrower
  yusdPaid.fee = event.params._YUSDFee
  yusdPaid.transaction = event.transaction.hash
  yusdPaid.blockNum = event.block.number
  yusdPaid.timestamp = event.block.timestamp
  yusdPaid.save()
}

export function handleVariablePaid(event: VariableFeePaid): void {
  let id = event.block.hash.toHex()
  let variablePaid =  new VariablePaid(id)
  variablePaid.borrower = event.params._borrower
  variablePaid.fee = event.params._YUSDVariableFee
  variablePaid.transaction = event.transaction.hash
  variablePaid.blockNum = event.block.number
  variablePaid.timestamp = event.block.timestamp
  variablePaid.save()
}


