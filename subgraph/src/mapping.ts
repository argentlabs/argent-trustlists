import { BigInt, Address, store, Bytes } from "@graphprotocol/graph-ts"
import {
  DappRegistry,
  DappAdded,
  DappRemoved,
  FilterUpdateRequested,
  FilterUpdated,
  OwnerChanged,
  RegistryCreated,
  TimelockChangeRequested,
  TimelockChanged
} from "../generated/DappRegistry/DappRegistry"
import { Registry, Timelock, Dapp } from "../generated/schema"

let timelockId = "t"

function dappId(registryId: i32, dappId: Address): string {
  return registryId.toString() + ":" + dappId.toHexString()
}

function registryId(registryId: i32): string {
  return BigInt.fromI32(registryId).toString()
}

export function handleDappAdded(event: DappAdded): void {
  let dapp = new Dapp(dappId(event.params.registryId, event.params.dapp))
  dapp.validAfter = event.params.validAfter
  dapp.lastChange = event.params.validAfter
  dapp.dapp = event.params.dapp
  dapp.filter = event.params.filter
  dapp.registry = registryId(event.params.registryId)
  dapp.save()
}

export function handleDappRemoved(event: DappRemoved): void {
  store.remove('Dapp', dappId(event.params.registryId, event.params.dapp))
}

export function handleFilterUpdateRequested(
  event: FilterUpdateRequested
): void {
  let dapp = new Dapp(dappId(event.params.registryId, event.params.dapp))
  dapp.pendingFilter = event.params.filter
  dapp.pendingConfirmAfter = event.params.validAfter
  dapp.save()
}

export function handleFilterUpdated(event: FilterUpdated): void {
  let dapp = new Dapp(dappId(event.params.registryId, event.params.dapp))
  dapp.lastChange = event.params.validAfter
  dapp.filter = event.params.filter
  dapp.pendingFilter = null
  dapp.pendingConfirmAfter = null
  dapp.save()
}

export function handleOwnerChanged(event: OwnerChanged): void {
  let registry = new Registry(registryId(event.params.registryId))
  registry.owner = event.params.newRegistryOwner
  registry.save()
}

export function handleRegistryCreated(event: RegistryCreated): void {
  let registry = new Registry(registryId(event.params.registryId))
  registry.owner = event.params.registryOwner
  registry.registryId = event.params.registryId
  registry.save()
}

export function handleTimelockChangeRequested(
  event: TimelockChangeRequested
): void {
  let timelock = new Timelock(timelockId)
  timelock.pendingTime = event.params.newTimelockPeriod

  let contract = DappRegistry.bind(event.address)
  timelock.pendingConfirmAfter = contract.timelockPeriod() + event.block.timestamp
  timelock.save()
}

export function handleTimelockChanged(event: TimelockChanged): void {
  let timelock = new Timelock(timelockId)
  timelock.time = event.params.newTimelockPeriod
  timelock.pendingTime = null
  timelock.pendingConfirmAfter = null
  timelock.save()
}