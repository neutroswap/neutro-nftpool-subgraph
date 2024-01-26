import {
  Deposit, Withdraw
} from "../types/templates/NitroPool/NitroPool"
import { NftPoolToken, NitroPool } from "../types/schema"

export function handleDeposit(event: Deposit): void {
  let nftPoolToken = NftPoolToken.load(event.params.nftPool.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.stakedInNitroPool = event.address
  nftPoolToken.save()

  let nitroPool = NitroPool.load(event.address)!
  nitroPool.totalLpToken = nitroPool.totalLpToken.plus(event.params.amount)
  nitroPool.save()
}

export function handleWithdraw(event: Withdraw): void {
  let nftPoolToken = NftPoolToken.load(event.params.tokenId.toHex() + "-" + event.params.tokenId.toHex())!
  nftPoolToken.stakedInNitroPool = event.address
  nftPoolToken.save()

  let nitroPool = NitroPool.load(event.address)!
  nitroPool.totalLpToken = nitroPool.totalLpToken.plus(event.params.amount)
  nitroPool.save()
}

