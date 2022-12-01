import axios, { AxiosResponse } from 'axios'
import { delay } from 'bluebird'
import * as http from 'http'
import * as https from 'https'
import { factoryAddress, Pair } from 'lib/terraswap'
import { ColumbusTerraswap } from 'lib/terraswap/classic'
import { stringToDate } from 'lib/utils'
import { START_BLOCK_HEIGHT } from 'migrate_col5_pairs/main'
import { Cycle } from 'types'

import { PoolInfoDto } from '../dtos'

const lcdUrl = process.env.TERRA_LCD || 'https://lcd.terra.dev'
const terraswapQuerier = new ColumbusTerraswap(lcdUrl)
const poolInfoBasePath = `/terra/wasm/v1beta1/contracts/address/store?query_msg=eyJwb29sIjp7fX0=`
const blockBasePath = `/blocks/height`
const lcdClient = axios.create({
  baseURL: lcdUrl,
  httpAgent: new http.Agent({ keepAlive: true, maxTotalSockets: 5, keepAliveMsecs: 5 * 1000 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxTotalSockets: 5 }),
  timeout: 2 * 1000,
})

export async function getLatestBlockHeight(): Promise<number> {
  try {
    const res = await await lcdClient.get(`/blocks/latest`)
    return parseInt(res.data.block.header.height)
  } catch (err) {
    throw new Error(`cannot get latest block height`)
  }
}

export async function getPoolInfo(pairAddress: string, height?: number): Promise<PoolInfoDto> {
  const path = poolInfoBasePath.replace('address', pairAddress)
  let headers
  if (height) {
    headers = {
      'x-cosmos-block-height': `${height}`,
    }
  }
  try {
    const res = await lcdClient.get(path, {
      headers,
    })
    return res.data
  } catch (err) {
    await delay(100)
  }
}

export async function getBlockTime(height: number): Promise<string> {
  const path = blockBasePath.replace('height', height + '')
  const res = await lcdClient.get(path)
  return res?.data?.block.header.time

}

export async function getBlockHeightByTime(targetTimestamp: number, cycle: Cycle): Promise<number> {
  const path = blockBasePath.replace('height', 'latest')
  const res = await lcdClient.get(path)

  let r = parseInt(res?.data?.block.header.height)
  let l = START_BLOCK_HEIGHT

  while (l < r) {
    const m = Math.floor((r + l) / 2)
    const path = blockBasePath.replace('height', `${m}`)
    const res = await lcdClient.get(path)
    const time = res?.data?.block.header.time

    const blockTime = stringToDate(time, cycle).getTime()
    if (blockTime === targetTimestamp) {
      return m
    } else if (blockTime < targetTimestamp) {
      l = m + 1
    } else {
      r = m - 1
    }
  }
  return l
}

export async function migrationHeight(): Promise<number> {
  let r = await getLatestBlockHeight()
  let l = START_BLOCK_HEIGHT
  const queryStr = `{"pairs": {}}`
  const data = Buffer.from(queryStr).toString('base64')
  while (l < r) {
    const m = Math.floor((l + r) / 2)
    const res = await terraswapQuerier.queryContract(factoryAddress, data, m)
    if (res?.pairs?.length && l == m) {
      break
    }
    if (res?.pairs?.length) {
      r = m - 1
    } else {
      l = m + 1
    }
  }
  return l
}

export async function getAllPairs(height?: number): Promise<Pair[]> {
  return await terraswapQuerier.getAllPairs(height)
}

export async function getVerifiedTokens(): Promise<TokensRes> {
  const res: AxiosResponse<VerifiedTokensRes> = await lcdClient.get('https://assets.terra.money/cw20/tokens.json')
  return res.data.classic
}

interface TokensRes {
  [key: string]: {
    protocol?: string
    symbol?: string
    name?: string
    token?: string
    icon?: string
    decimals?: number
  }
}

interface VerifiedTokensRes {
  mainnet: TokensRes
  classic: TokensRes
  testnet: TokensRes
}


