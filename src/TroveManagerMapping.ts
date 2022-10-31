import { TroveUpdated, TroveManager, TotalStakesUpdated} from '../generated/TroveManager/TroveManager'
import {updatedTrove, totalStake} from '../generated/schema'

export function handleTotalStakesUpdated(event: TotalStakesUpdated): void {
  let id = event.transaction.hash.toHex()
  let TotalStakes = new totalStake(id)
  TotalStakes.token = event.params.token
  TotalStakes.newTotalStakes = event.params._newTotalStakes
  TotalStakes.save()
}