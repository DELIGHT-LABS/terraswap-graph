import { EntityManager } from 'typeorm'
import { isNative } from 'lib/utils'
import { isClassic } from 'lib/terra'
import { baseCurrency } from 'lib/terraswap'
import { PairDayDataEntity, PairInfoEntity, TokenInfoEntity } from 'orm'
import { ExchangeRate } from 'types'
import { num } from 'lib/num'

// get token's UST price from token-UST pair that have the largest liquidity
export async function getTokenPriceAsUST(
  manager: EntityManager,
  token: string,
  timestamp: Date,
  exchangeRate: ExchangeRate | undefined
): Promise<UstPrice> {
  const possible = await manager.getRepository(PairInfoEntity).createQueryBuilder()
    .where(`token_0 = :token0 OR token_1 = :token1`, { token0: baseCurrency, token1: baseCurrency })
    .getCount();
  if (!possible) {
    return { price: "0", liquidity: "0" };
  }

  if (isClassic) {
    return await _classicTokenPrice(manager, token, timestamp, exchangeRate)
  }
  return await _terra2TokenPrice(manager, token, timestamp)
}

async function _classicTokenPrice(manager: EntityManager,
  token: string,
  timestamp: Date,
  exchangeRate: ExchangeRate | undefined
): Promise<UstPrice> {

  const price: { [key: string]: UstPrice } = {};
  price[token] = { price: "0", liquidity: "0" };

  let biggestLiquidity = num(0);
  let oraclePrice = exchangeRate?.result.find(r => r.denom === "uusd")?.amount;
  oraclePrice = oraclePrice ? oraclePrice : "0";
  price[baseCurrency] = { price: oraclePrice, liquidity: biggestLiquidity.toString() };

  if (baseCurrency === token) {
    return price[baseCurrency];
  }

  const paths: Map<string, Set<PairData>> = new Map();
  const pairs = await manager.getRepository(PairDayDataEntity).createQueryBuilder()
    .distinctOn(['pair'])
    .where("timestamp <= :timestamp", { timestamp })
    .andWhere("token_0_reserve != 0 AND token_1_reserve != 0")
    .orderBy("pair", "ASC")
    .addOrderBy("timestamp", "DESC")
    .getMany();


  pairs.forEach(p => {
    const pd: PairData = {
      pair: p.pair,
      liquidity: p.liquidityUst,
      volume: p.volumeUst,
      assets: [
        { token: p.token0, reserve: p.token0Reserve, volume: p.token0Volume },
        { token: p.token1, reserve: p.token1Reserve, volume: p.token1Volume },
      ]
    }
    paths.set(p.token0, paths.get(p.token0)?.add(pd) || new Set([pd]));
    paths.set(p.token1, paths.get(p.token1)?.add(pd) || new Set([pd]));
    if (p.token0 === baseCurrency || p.token1 === baseCurrency) {
      biggestLiquidity = num(p.liquidityUst).gt(biggestLiquidity) ? num(p.liquidityUst) : biggestLiquidity;
    }
  });

  const visited: { [key: string]: boolean } = {};
  const tokenQueue: string[] = [baseCurrency];
  visited[baseCurrency] = true;

  while (tokenQueue.length > 0) {
    const target = tokenQueue.shift();
    if (target === token) {
      break;
    }
    paths.get(target)?.forEach(p => {
      const other = p.assets[0].token === target ? p.assets[1].token : p.assets[0].token;
      const otherPrice = _calculatePrice(p.assets, target, price[target].price);
      if (!price[other] || num(price[other].liquidity).lt(num(p.liquidity))) {
        price[other] = { price: otherPrice, liquidity: p.liquidity };
      }
      if (visited[other]) {
        return
      }
      visited[other] = true
      tokenQueue.push(other);
    })
  }

  return price[token]
}

async function _terra2TokenPrice(manager: EntityManager,
  token: string,
  timestamp: Date,
): Promise<UstPrice> {
  const price: { [key: string]: UstPrice } = {};
  price[token] = { price: "0", liquidity: "0" };

  const possible = await manager.getRepository(PairInfoEntity).createQueryBuilder()
    .where(`token_0 = :token0 OR token_1 = :token1`, { token0: baseCurrency, token1: baseCurrency })
    .getCount();
  if (!possible) {
    return price[token];
  }

  const paths: Map<string, Set<PairData>> = new Map();
  const pairs = await manager.getRepository(PairDayDataEntity).createQueryBuilder()
    .distinctOn(['pair'])
    .where("timestamp <= :timestamp", { timestamp })
    .andWhere("token_0_reserve != 0 AND token_1_reserve != 0")
    .orderBy("pair", "ASC")
    .addOrderBy("timestamp", "DESC")
    .getMany();


  let biggestLiquidity = num(0);
  price[baseCurrency] = { price: "1", liquidity: biggestLiquidity.toString() };

  pairs.forEach(p => {
    const pd: PairData = {
      pair: p.pair,
      liquidity: p.liquidityUst,
      volume: p.volumeUst,
      assets: [
        { token: p.token0, reserve: p.token0Reserve, volume: p.token0Volume },
        { token: p.token1, reserve: p.token1Reserve, volume: p.token1Volume },
      ]
    }
    paths.set(p.token0, paths.get(p.token0)?.add(pd) || new Set([pd]));
    paths.set(p.token1, paths.get(p.token1)?.add(pd) || new Set([pd]));
    if (p.token0 === baseCurrency || p.token1 === baseCurrency) {
      biggestLiquidity = num(p.liquidityUst).gt(biggestLiquidity) ? num(p.liquidityUst) : biggestLiquidity;
    }
  });

  const visited: { [key: string]: boolean } = {};
  const tokenQueue: string[] = [baseCurrency];
  visited[baseCurrency] = true;

  while (tokenQueue.length > 0) {
    const target = tokenQueue.shift();
    paths.get(target).forEach(p => {
      const other = p.assets[0].token === target ? p.assets[1].token : p.assets[0].token;
      const otherPrice = _calculatePrice(p.assets, target, price[target].price);
      if (!price[other] || num(price[other].liquidity).lt(num(p.liquidity))) {
        price[other] = { price: otherPrice, liquidity: p.liquidity };
      }
      if (visited[other]) {
        return
      }
      visited[other] = true
      tokenQueue.push(other);
    })
  }

  return price[token]
}

function _calculatePrice(assets: Asset[], target: string, targetPrice: string): string {
  const targetIdx = assets.findIndex(a => a.token === target);
  const otherIdx = targetIdx === 0 ? 1 : 0;
  if (targetIdx === -1 || assets[otherIdx].reserve === "0") {
    return "0";
  }

  return num(assets[targetIdx].reserve).div(assets[otherIdx].reserve).multipliedBy(targetPrice).toString()
}


export async function getPairList(manager: EntityManager): Promise<Record<string, boolean>> {
  const pairInfoRepo = manager.getRepository(PairInfoEntity)
  const pairs = await pairInfoRepo.find({ select: ['pair'] })

  const pairList: Record<string, boolean> = {}

  for (const i of pairs) {
    pairList[i.pair] = true
  }

  return pairList
}

export async function getTokenList(manager: EntityManager): Promise<Record<string, boolean>> {
  const tokenInfoRepo = manager.getRepository(TokenInfoEntity)
  const tokens = await tokenInfoRepo.find({ select: ['tokenAddress'] })

  const tokenList: Record<string, boolean> = {}

  for (const i of tokens) {
    if (!isNative(i.tokenAddress)) tokenList[i.tokenAddress] = true
  }

  return tokenList
}

interface Asset {
  token: string
  reserve: string
  volume: string
}
interface PairData {
  pair: string
  assets: Asset[]
  liquidity: string
  volume: string
}

interface UstPrice {
  price: string
  liquidity: string
}
