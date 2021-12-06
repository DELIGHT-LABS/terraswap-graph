import { Injectable, NotFoundException } from '@nestjs/common'
import { DashboardPairsRepository } from 'dashboard/repositories/pairs.repository'
import { BigNumber } from 'lib/num'
import memoize from 'memoizee-decorator'
import { Cycle } from 'types'
import { TERRASWAP_SWAP_FEE_RATE } from './common/defined'
import { calculateFee, calculateIncreasedRate } from './common/utils'
import {
  PairDto,
  PairRecentCycleDto,
  PairRecentDataDto,
  PairRecentVolumeAndLiquidityDto,
  PairsDto,
  PairsDtos,
} from './dtos/pairs.dtos'

@Injectable()
export class DashboardPairsService {
  constructor(private readonly repo: DashboardPairsRepository) {}

  @memoize({ promise: true, maxAge: 60000 })
  async getPairs(): Promise<PairsDtos> {
    const dtos = await this.repo.getPairsLatestData()
    const now = Date.now()
    const volumes = await this.repo.getLastWeekVolumes(now)
    const liquidities = await this.repo.getLatestLiquidities(now)

    const pairsDict: { [pairAddr: string]: PairsDto } = dtos.reduce(function (dict: any, obj) {
      obj.apr = '0'
      dict[obj.pairAddress] = obj
      return dict
    }, {})

    const pairsWeekDict: {
      [pairAddr: string]: { pairAddress: string; volume: string; liquidityUst: string }
    } = volumes.reduce(function (map: any, obj) {
      map[obj.pairAddress] = Object.assign({ totalLpTokenShare: '0' }, obj)
      return map
    }, {})
    liquidities.forEach((p) => {
      pairsWeekDict[p.pairAddress].liquidityUst = p.liquidityUst
    })

    Object.values(pairsWeekDict).forEach((obj) => {
      const pair = pairsDict[obj.pairAddress]
      if (!pair) return
      pair.apr = this.calculateApr(obj.volume, obj.liquidityUst)
    })
    return Object.values(pairsDict)
  }

  @memoize({ promise: true, maxAge: 60000, primitive: true, length: 1 })
  async getPair(addr: string): Promise<PairDto> {
    const pairDto = await this.repo.getPair(addr)

    if (!pairDto) {
      throw new NotFoundException()
    }

    pairDto.volume24h = await this.repo.get24hVolume(addr)

    pairDto.token0.price = new BigNumber(pairDto.token1Reserve)
      .div(new BigNumber(pairDto.token0Reserve))
      .toString()

    pairDto.token1.price = new BigNumber(pairDto.token0Reserve)
      .div(new BigNumber(pairDto.token1Reserve))
      .toString()

    return pairDto
  }

  @memoize({ promise: true, maxAge: 60 * 1000 })
  async getRecentDataOfPair(pairAddress: string): Promise<PairRecentDataDto> {
    const now = Date.now()
    const today = await this.repo.getVolumeAndLiquidityOfPair(
      pairAddress,
      new Date(now - Cycle.DAY),
      new Date(now)
    )
    const yesterday = await this.repo.getVolumeAndLiquidityOfPair(
      pairAddress,
      new Date(now - Cycle.DAY * 2),
      new Date(now - Cycle.DAY)
    )
    const thisWeek = await this.repo.getVolumeAndLiquidityOfPair(
      pairAddress,
      new Date(now - Cycle.WEEK),
      new Date(now)
    )
    const lastWeek = await this.repo.getVolumeAndLiquidityOfPair(
      pairAddress,
      new Date(now - Cycle.WEEK * 2),
      new Date(now - Cycle.WEEK)
    )

    if (!today) {
      throw new NotFoundException()
    }

    return {
      daily: this.toRecentCycleDto(today, yesterday),
      weekly: this.toRecentCycleDto(thisWeek, lastWeek),
    }
  }

  private calculateApr(volume: string, liquidityUst: string): string {
    if (new BigNumber(liquidityUst).isLessThanOrEqualTo(0)) {
      return '0'
    }
    return new BigNumber(volume)
      .dividedBy(new BigNumber(liquidityUst))
      .dividedBy(7)
      .multipliedBy(365)
      .multipliedBy(TERRASWAP_SWAP_FEE_RATE)
      .toString()
  }

  private toRecentCycleDto(
    current: PairRecentVolumeAndLiquidityDto,
    previous: PairRecentVolumeAndLiquidityDto
  ): PairRecentCycleDto {
    const fee = calculateFee(current.volume)
    return {
      volume: current.volume,
      volumeIncreasedRate: calculateIncreasedRate(current.volume, previous.volume),
      liquidity: current.liquidity,
      liquidityIncreasedRate: calculateIncreasedRate(current.liquidity, previous.liquidity),
      fee,
      feeIncreasedRate: calculateIncreasedRate(fee, calculateFee(previous.volume)),
    }
  }
}
