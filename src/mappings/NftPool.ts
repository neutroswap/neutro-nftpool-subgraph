import {
  AddToPosition, CreatePosition, WithdrawFromPosition, LockPosition, SplitPosition, MergePositions, SetBoost, Transfer
} from "../types/templates/NftPool/NftPool"
import { NftPoolToken, UserInNFtPool, NitroPool } from "../types/schema"
import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { ADDRESS_ZERO } from "./helpers";

export function handleCreatePosition(event: CreatePosition): void {
  let userInNFtPool = UserInNFtPool.load(event.transaction.from)
  if (userInNFtPool == null) {
    userInNFtPool = new UserInNFtPool(event.transaction.from)
  }
  userInNFtPool.save()

  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())
  if (nftPoolToken == null) {
    nftPoolToken = new NftPoolToken(event.address.toHex() + "-" + event.params.tokenId.toHex())
  }

  // assign the entity field outside the null handling for automatically handle the burn tokenId
  nftPoolToken.tokenId = event.params.tokenId
  nftPoolToken.amountLpToken = event.params.amount
  nftPoolToken.startLockTime = event.block.timestamp
  nftPoolToken.lockDuration = event.params.lockDuration
  nftPoolToken.endLockTime = nftPoolToken.startLockTime.plus(nftPoolToken.lockDuration)
  // nftPoolToken.lockMultiplier = BigInt.zero()
  nftPoolToken.status = true
  nftPoolToken.boostPoints = BigInt.zero()
  nftPoolToken.stakedInNitroPool = ADDRESS_ZERO

  // assign the relationship
  nftPoolToken.nftPool = event.address
  nftPoolToken.user = event.transaction.from
  nftPoolToken.save()
}

export function handleAddToPosition(event: AddToPosition): void {
  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.amountLpToken = nftPoolToken.amountLpToken.plus(event.params.amount)

  if (nftPoolToken.lockDuration.gt(BigInt.zero())) {
    nftPoolToken.startLockTime = event.block.timestamp
    nftPoolToken.endLockTime = nftPoolToken.startLockTime.plus(nftPoolToken.lockDuration)
  }

  nftPoolToken.save()
}

export function handleWithdrawFromPosition(event: WithdrawFromPosition): void {
  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.amountLpToken = nftPoolToken.amountLpToken.minus(event.params.amount)
  if (nftPoolToken.amountLpToken.equals(BigInt.zero())) {
    nftPoolToken.status = false
  }
  nftPoolToken.save()
}

export function handleLockPosition(event: LockPosition): void {
  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.startLockTime = event.block.timestamp
  nftPoolToken.lockDuration = event.params.lockDuration
  nftPoolToken.endLockTime = nftPoolToken.startLockTime.plus(nftPoolToken.lockDuration)
  nftPoolToken.save()
}

export function handleSplitPosition(event: SplitPosition): void {
  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.amountLpToken = nftPoolToken.amountLpToken.minus(event.params.splitAmount)

  let newSplittedNftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.newTokenId.toHex())
  if (newSplittedNftPoolToken == null) {
    newSplittedNftPoolToken = new NftPoolToken(event.address.toHex() + "-" + event.params.newTokenId.toHex())
  }
  newSplittedNftPoolToken.tokenId = event.params.tokenId
  newSplittedNftPoolToken.amountLpToken = event.params.splitAmount
  newSplittedNftPoolToken.startLockTime = nftPoolToken.startLockTime
  newSplittedNftPoolToken.lockDuration = nftPoolToken.lockDuration
  newSplittedNftPoolToken.endLockTime = nftPoolToken.endLockTime
  // newSplittedNftPoolToken.lockMultiplier = nftPoolToken.lockMultiplier
  newSplittedNftPoolToken.status = true
  newSplittedNftPoolToken.boostPoints = nftPoolToken.boostPoints
  newSplittedNftPoolToken.stakedInNitroPool = ADDRESS_ZERO

  // assign the relationship
  newSplittedNftPoolToken.nftPool = event.address
  newSplittedNftPoolToken.user = event.transaction.from

  nftPoolToken.save()
  newSplittedNftPoolToken.save()
}

export function handleMergePosition(event: MergePositions): void {
  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenIds[0].toHex())!
  nftPoolToken.lockDuration = event.params.destLockDuration

  let latestStartLockTime = nftPoolToken.startLockTime
  let totalAmountOfLpToken = nftPoolToken.amountLpToken
  // starts from 1, 0 already assigned
  for (let i = 1; i < event.params.tokenIds.length; i++) {
    let nextNftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenIds[i].toHex())!
    if (nextNftPoolToken.startLockTime.gt(latestStartLockTime)) {
      latestStartLockTime = nextNftPoolToken.startLockTime
    }
    totalAmountOfLpToken = totalAmountOfLpToken.plus(nextNftPoolToken.amountLpToken)
    nextNftPoolToken.amountLpToken = BigInt.zero()
    nextNftPoolToken.status = false
    nextNftPoolToken.save()
  }
  nftPoolToken.startLockTime = latestStartLockTime
  nftPoolToken.endLockTime = nftPoolToken.startLockTime.plus(nftPoolToken.lockDuration)
  nftPoolToken.amountLpToken = totalAmountOfLpToken

  nftPoolToken.save()
}

export function handleSetBoost(event: SetBoost): void {
  let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.boostPoints = event.params.boostPoints
  nftPoolToken.save()
}

export function handleTransfer(event: Transfer): void {
  if (event.params.from == Address.zero()) {
    return
  }

  if (event.params.to == Address.zero()) {
    return
  }

  let nitroPool = NitroPool.load(event.params.to)
  if (nitroPool == null) {
    let userInNFtPool = UserInNFtPool.load(event.transaction.from)
    if (userInNFtPool == null) {
      userInNFtPool = new UserInNFtPool(event.transaction.from)
      userInNFtPool.save()
    }

    let nftPoolToken = NftPoolToken.load(event.address.toHex() + "-" + event.params.tokenId.toHex())!
    nftPoolToken.user = event.params.to
    nftPoolToken.save()
  }
}
