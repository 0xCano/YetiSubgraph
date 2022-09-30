import { TroveUpdated, TroveManager, TotalStakesUpdated} from '../generated/TroveManager/TroveManager'
import {updatedTrove, totalStake} from '../generated/schema'
import { Bytes } from '@graphprotocol/graph-ts'
import { Address} from '@graphprotocol/graph-ts'
import { Liquidation } from '../generated/TroveManagerLiquidations/TroveManagerLiquidations'
import {getRealAmounts} from './BorrowerOperationsMapping'

function addressToBytes(address: Address): Bytes {
  return Bytes.fromHexString(address.toHexString())
}

export function handleTotalStakesUpdated(event: TotalStakesUpdated): void {
  let id = event.transaction.hash.toHex()
  let TotalStakes = new totalStake(id)
  TotalStakes.token = event.params.token
  TotalStakes.newTotalStakes = event.params._newTotalStakes
  TotalStakes.save()
}