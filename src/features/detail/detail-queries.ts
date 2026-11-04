import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { nftService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import type { NftDetail } from '@/shared/api/api-types'
import { toCatalogNft, useNftList } from '@/features/catalog/catalog-queries'
import type { CatalogNft } from '@/features/catalog/catalog-types'

export function useNftDetail(nftId: string) {
  return useQuery<NftDetail>({
    queryKey: queryKeys.nftDetail(nftId),
    queryFn: ({ signal }) => nftService.getById(nftId, { signal })
  })
}

/** Related NFTs reuse the list query (no dedicated endpoint yet), excluding the current one. */
export function useRelatedNfts(excludeId: string): CatalogNft[] {
  const list = useNftList({ pageSize: 6, sort: 'featured' })
  return useMemo(
    () =>
      (list.data?.data ?? [])
        .filter((nft) => nft.id !== excludeId)
        .slice(0, 5)
        .map(toCatalogNft),
    [list.data, excludeId]
  )
}

/** Copies still on sale = editions not yet minted, floored at zero. */
export function remainingEditions(detail: NftDetail): number {
  return Math.max(0, detail.totalEdition - detail.edition)
}
