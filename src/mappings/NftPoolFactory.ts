import {
  PoolCreated
} from "../types/NftPoolFactory/NftPoolFactory"
import { NftPool as NftPoolTemplate } from "../types/templates"
import { NftPoolFactory, NftPool } from "../types/schema"

export function handleCreateNftPool(event: PoolCreated): void {
  let nftPoolFactory = NftPoolFactory.load(event.address)
  if (nftPoolFactory == null) {
    nftPoolFactory = new NftPoolFactory(event.address)
  }

  nftPoolFactory.save()

  let nftPool = NftPool.load(event.params.pool)
  if (nftPool == null) {
    nftPool = new NftPool(event.params.pool)
    nftPool.nftPoolFactory = event.address
    nftPool.lpToken = event.params.lpToken
  }

  NftPoolTemplate.create(event.params.pool)
  nftPool.save()
}
