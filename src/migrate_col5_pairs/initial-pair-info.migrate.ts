import { delay } from 'bluebird'
import { isTokenOrderedWell, stringToDate } from 'lib/utils'
import {
  PairDataEntity,
  PairDayDataEntity,
  PairHourDataEntity,
  PairInfoEntity,
} from 'orm'
import { EntityManager, getManager, getRepository } from 'typeorm'
import { Cycle } from 'types'
import { getAssetId, PoolInfoDto } from './dtos'
import { getBlockTime, getLatestBlockHeight, getPoolInfo } from './repository/info.repository'

const col5Height = 4724000

async function getCandidateAddresses() {
  const sub = getRepository(PairDayDataEntity)
    .createQueryBuilder('pd')
    .select('pd.pair', 'pairAddress')
    .distinct(true)
    .getQuery()

  const mq = getRepository(PairInfoEntity)
    .createQueryBuilder('p')
    .select('p.pair', 'pair')
    .where(
      'p.pair NOT IN (' + sub + ')'
    )

  const pairAddresses = await mq.getRawMany()
  return pairAddresses.map(p=> p.pair)
}

async function findFirstAppearance(pair: string, latestHeight: number) {
  let l = col5Height
  let r = latestHeight

  let res: PoolInfoDto = await getPoolInfo(pair, latestHeight)


  while (l < r) {
    const m = Math.floor((l + r) / 2)
    console.time(`GET_POOL:${pair}`)
    res = await getPoolInfo(pair, m)
    console.timeEnd(`GET_POOL:${pair}`)
    await delay(1000)

    if (res) {
      r = m
    } else {
      l = m + 1
    }
  }
  if (!res) {
    res = await getPoolInfo(pair, l)
  }
  let retry = 3
  while (!(res?.timestamp) && retry) {
    res.timestamp = await getBlockTime(l)
    retry--
  }
  if (!retry) {
    throw new Error(`cannot get blockTime for pair ${pair}, height: ${l} `)
  }

  return res
}

export async function migratePairsInfo() {
  const pairs = await getCandidateAddresses()
  const latestHeight = await getLatestBlockHeight()

  for (let i = 0; i < pairs.length; ++i) {
    const p = pairs[i]
    await delay(1000)
    let poolInfo;

    try {
      poolInfo = await findFirstAppearance(p, latestHeight)
    } catch (err) {
      i--;
      continue;
    }
    const assets = poolInfo.result.assets.map((a) => getAssetId(a.info))

    const token0 = isTokenOrderedWell(assets)
      ? poolInfo.result.assets[0]
      : poolInfo.result.assets[1]

    const token1 = isTokenOrderedWell(assets)
      ? poolInfo.result.assets[1]
      : poolInfo.result.assets[0]

    const entity = new PairDataEntity({
      pair: p,
      token0: getAssetId(token0.info),
      token1: getAssetId(token1.info),
      token0Reserve: token0.amount,
      token1Reserve: token1.amount,
      totalLpTokenShare: poolInfo.result.total_share,
      token0Volume: '0',
      token1Volume: '0',
      volumeUst: '0',
      liquidityUst: '0',
      txns: 1,
      timestamp: poolInfo.timestamp,
    })

    const cycles = [Cycle.HOUR, Cycle.DAY, Cycle.WEEK]
    await getManager().transaction(async (manager) => {
      const promises = cycles.map((c) => {
        return savePairData(manager, [entity], c)
      })
      await Promise.all(promises)
    })
  }

}

async function savePairData(manager: EntityManager, entities: PairDataEntity[], cycle: Cycle) {
  if (cycle !== Cycle.HOUR && cycle !== Cycle.DAY && Cycle.WEEK !== cycle) {
    throw new Error(`wrong format cycle`)
  }

  const parsedTimeEntities = entities.map((e) => {
    e.timestamp = stringToDate(e.timestamp.toString(), Cycle.HOUR)
    return e
  })

  let repo = manager.getRepository(PairHourDataEntity)

  if (cycle === Cycle.DAY) {
    repo = getRepository(PairDayDataEntity)
  }

  await repo.save(parsedTimeEntities)
}
