import { Pair } from 'lib/terraswap'
import { isNative, isTokenOrderedWell } from 'lib/utils'
import { PairInfoEntity, TokenInfoEntity } from 'orm'

import { EntityManager, getConnection } from 'typeorm'
import { getAllPairs, getVerifiedTokens, getMigrationHeight } from './repository/info.repository'

function setPairs(token: string, pair: string, tokenToPairMap: Map<string, string[]>) {

  const pairs = tokenToPairMap.get(token) || []
  pairs.push(pair)
  tokenToPairMap.set(token, pairs)
}

async function loadTokens(): Promise<TokenInfoEntity[]> {
  const tokens = await getVerifiedTokens();
  return Object.keys(tokens).map(k => {
    return new TokenInfoEntity({
      decimals: tokens[k].decimals,
      tokenAddress: tokens[k].token,
      symbol: tokens[k].symbol,
    })
  })
}

async function loadPairs(height: number): Promise<Pair[]> {
  return await getAllPairs(height)
}

export async function migrateData(): Promise<void> {
  const height = await getMigrationHeight()
  const pairs = await loadPairs(height)
  const tokens = await loadTokens()
  const verifiedTokenMap = new Map<string, TokenInfoEntity>(tokens.map(t => [t.tokenAddress, t]))
  await getConnection().transaction(async (manager: EntityManager) => {
    const pairRepo = manager.getRepository(PairInfoEntity)
    const tokenRepo = manager.getRepository(TokenInfoEntity)
    const tokenToPairMap: Map<string, string[]> = new Map<string, string[]>()
    const tokenSet: Set<string> = new Set<string>()

    const pairEntities: PairInfoEntity[] = pairs.map((p) => {
      const assets = [p.assets[0].addr, p.assets[1].addr]
      const token0 = isTokenOrderedWell(assets) ? assets[0] : assets[1]
      const token1 = isTokenOrderedWell(assets) ? assets[1] : assets[0]

      const entity = pairRepo.create({
        lpToken: p.lp,
        pair: p.addr,
        token0,
        token1,
      })
      setPairs(entity.token0, entity.pair, tokenToPairMap)
      setPairs(entity.token1, entity.pair, tokenToPairMap)
      setPairs(entity.lpToken, entity.pair, tokenToPairMap)
      tokenSet.add(entity.token0)
      tokenSet.add(entity.token1)
      tokenSet.add(entity.lpToken)

      return entity
    })

    const tokenEntities: TokenInfoEntity[] = []
    tokenSet.forEach((t) => {
      const pairs = tokenToPairMap.get(t) || []

      const verifiedToken = verifiedTokenMap.get(t)
      const symbol = verifiedToken?.symbol ? verifiedToken.symbol : isNative(t) ? t.substring(1, 3).toUpperCase() + "T" : t
      tokenEntities.push(
        tokenRepo.create({
          decimals: verifiedToken?.decimals || 6,
          pairs,
          symbol,
          tokenAddress: verifiedToken?.tokenAddress || t,
        })
      )
    })

    await pairRepo.save(pairEntities)
    await tokenRepo.save(tokenEntities)
  })
}
