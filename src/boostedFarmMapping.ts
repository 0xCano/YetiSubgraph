import { BoostedFarm, Deposit, EmergencyWithdraw, Withdraw } from "../generated/BoostedFarm/BoostedFarm"
import { farmOperation } from "../generated/schema"

// Mapping of boosted farm Deposit event.
export function handleDeposit(event: Deposit): void {
    let id = event.transaction.hash.toHex()
    let deposit = farmOperation.load(id)
    if (deposit == null) {
        deposit = new farmOperation(id)
    }
    deposit.user = event.params.user
    const contract = BoostedFarm.bind(event.address)
    deposit.boostedPartition = contract.boostedPartition()
    deposit.rewardRate = contract.rewardRate()
    deposit.amountOfLP = contract.userInfo(event.params.user).value0
    deposit.userFactor = contract.userInfo(event.params.user).value2
    deposit.sumOfFactors = contract.sumOfFactors()
    deposit.amount = event.params.amount
    deposit.operation = 'Deposit'
    deposit.timestamp = event.block.timestamp
    deposit.blockNum = event.block.number
    deposit.save()
}

// Mapping of boosted farm Withdraw event.
export function handleWithdraw(event: Withdraw): void {
    let id = event.transaction.hash.toHex()
    let deposit = farmOperation.load(id)
    if (deposit == null) {
        deposit = new farmOperation(id)
    }
    deposit.user = event.params.user
    const contract = BoostedFarm.bind(event.address)
    deposit.boostedPartition = contract.boostedPartition()
    deposit.rewardRate = contract.rewardRate()
    deposit.amountOfLP = contract.userInfo(event.params.user).value0
    deposit.userFactor = contract.userInfo(event.params.user).value2
    deposit.sumOfFactors = contract.sumOfFactors()
    deposit.amount = event.params.amount
    deposit.operation = 'Withdraw'
    deposit.timestamp = event.block.timestamp
    deposit.blockNum = event.block.number
    deposit.save()
}

// Mapping of boosted farm EmergencyWithdraw event.
export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
    let id = event.transaction.hash.toHex()
    let deposit = farmOperation.load(id)
    if (deposit == null) {
        deposit = new farmOperation(id)
    }
    deposit.user = event.params.user
    const contract = BoostedFarm.bind(event.address)
    deposit.boostedPartition = contract.boostedPartition()
    deposit.rewardRate = contract.rewardRate()
    deposit.amountOfLP = contract.userInfo(event.params.user).value0
    deposit.userFactor = contract.userInfo(event.params.user).value2
    deposit.sumOfFactors = contract.sumOfFactors()
    deposit.amount = event.params.amount
    deposit.operation = 'Emergency Withdraw'
    deposit.timestamp = event.block.timestamp
    deposit.blockNum = event.block.number
    deposit.save()
}