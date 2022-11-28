import {CollateralAdded, CollateralDeprecated, CollateralUndeprecated, DeprecateAllCollateralCall, DeprecateCollateralCall} from '../generated/YetiController/YetiController'
import {collateral} from '../generated/schema'
import { Address, ethereum, Bytes, ByteArray, bigInt, BigInt} from '@graphprotocol/graph-ts'
import { getTxnInputDataToDecode } from './utils'


// Mapping of CollateralAdded Event.
export function handleCollateralAdded(event: CollateralAdded): void {
    let id = event.params._collateral.toHex()
    let col = new collateral(id)
    col.address = event.params._collateral
    col.status = 'Added'

    const dataToDecode = getTxnInputDataToDecode(event)
    
    if (dataToDecode) {
        let decoded = ethereum.decode(
            '(address,uint256,uint256,address,uint256,address,bool,address)',
            dataToDecode
        );
        if (decoded != null) {
            let t = decoded.toTuple();
            col.safetyRatio = t[1].toBigInt()
            col.recoveryRatio = t[2].toBigInt()
            col.oracle = t[3].toAddress()
            col.decimals = t[4].toBigInt()
            col.feeCurve = t[5].toAddress()
            col.isWrapped = t[6].toBoolean()
            col.routerAddress = t[7].toAddress()
        }
    }
    col.timestamp = event.block.timestamp
    col.transaction = event.transaction.hash
    col.blockNum = event.block.number
    col.save()
}


// Mapping of CollateralDeprecated Event.
export function handleCollateralDeprecated(event: CollateralDeprecated): void {
    let id = event.params._collateral.toHex()
    let col = collateral.load(id)
    if (col) {
        col.address = event.params._collateral
        col.status = 'Deprecated'
        col.timestamp = event.block.timestamp
        col.transaction = event.transaction.hash
        col.blockNum = event.block.number
        col.save()
    }
}


// Mapping of CollateralUndeprecated Event.
export function handleCollateralUndeprecated(event: CollateralUndeprecated): void {
    let id = event.params._collateral.toHex()
    let col = collateral.load(id)
    if (col) {
        col.address = event.params._collateral
        col.status = 'Undeprecated'
        col.timestamp = event.block.timestamp
        col.transaction = event.transaction.hash
        col.blockNum = event.block.number
        col.save()
    }
}

