import {
  CreateNitroPool
} from "../types/NitroPoolFactory/NitroPoolFactory"
import { NitroPool as NitroPoolTemplate } from "../types/templates"
import { NitroPoolFactory, NitroPool, NitroPoolRequirement, NftPool } from "../types/schema"
import { BigInt } from "@graphprotocol/graph-ts";

export function handleCreateNitroPool(event: CreateNitroPool): void {
  let nitroPoolFactory = NitroPoolFactory.load(event.address)
  if (nitroPoolFactory == null) {
    nitroPoolFactory = new NitroPoolFactory(event.address)
  }

  nitroPoolFactory.save()

  let nitroPool = NitroPool.load(event.params.nitroAddress)
  if (nitroPool == null) {
    nitroPool = new NitroPool(event.params.nitroAddress)
    nitroPool.nftPool = event.params.nftPool
    nitroPool.rewardsToken1 = event.params.rewardsToken1
    nitroPool.rewardsToken2 = event.params.rewardsToken2
    nitroPool.totalLpToken = BigInt.zero()
    nitroPool.nitroPoolFactory = event.address
  }

  // one-to-many relationship between nft-pool and nitro-pools
  // let nftPool = NftPool.load(event.params.nftPool)!
  // nftPool.nitroPool = nitroPool.id
  // nftPool.save()

  let nitroRequirements = NitroPoolRequirement.load(event.params.nitroAddress.toHex() + "-" + event.params.nftPool.toHex())
  if (nitroRequirements == null) {
    nitroRequirements = new NitroPoolRequirement(event.params.nitroAddress.toHex() + "-" + event.params.nftPool.toHex())
    nitroRequirements.nitroPool = event.params.nitroAddress
    nitroRequirements.startTime = event.params.settings.startTime
    nitroRequirements.endTime = event.params.settings.endTime
    nitroRequirements.harvestStartTime = event.params.settings.harvestStartTime
    nitroRequirements.depositEndTime = event.params.settings.depositEndTime
    nitroRequirements.lockDurationReq = event.params.settings.lockDurationReq
    nitroRequirements.lockEndReq = event.params.settings.lockEndReq
    nitroRequirements.depositAmountReq = event.params.settings.depositAmountReq
    nitroRequirements.whitelist = event.params.settings.whitelist
    nitroRequirements.description = event.params.settings.description
  }
  nitroRequirements.save()

  NitroPoolTemplate.create(event.params.nitroAddress)
  nitroPool.save()
}
