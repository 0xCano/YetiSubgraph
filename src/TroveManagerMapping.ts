import { TroveUpdated, TroveManager, TotalStakesUpdated, InterestApplied} from '../generated/TroveManager/TroveManager'
import {updatedTrove, totalStake, interestApplied} from '../generated/schema'


// Mapping of TotalStakesUpdated Event.
export function handleTotalStakesUpdated(event: TotalStakesUpdated): void {
  let id = event.transaction.hash.toHex()
  let TotalStakes = new totalStake(id)
  TotalStakes.token = event.params.token
  TotalStakes.newTotalStakes = event.params._newTotalStakes
  TotalStakes.save()
}

// Mapping of InterestApplied Event.
export function handleInterestApplied(event: InterestApplied): void {
  let id = event.transaction.hash.toHex()
  let interest =  new interestApplied(id)
  interest.borrower = event.params._borrower
  interest.totalInterest = event.params.totalInterest
  interest.transaction = event.transaction.hash
  interest.blockNum = event.block.number
  interest.timestamp = event.block.timestamp
  let trove = updatedTrove.load(id) 
  if (!trove) {
    trove = new updatedTrove(id)
  }
  trove.interest = event.params.totalInterest
  trove.save()
  interest.save()
}