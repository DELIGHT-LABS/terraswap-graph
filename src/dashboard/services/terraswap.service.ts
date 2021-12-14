import { Injectable, NotFoundException } from '@nestjs/common'
import { DashboardTerraswapRepository } from 'dashboard/repositories/terraswap.repository'
import memoize from 'memoizee-decorator'
import { Cycle } from 'types'
import { calculateFee, calculateIncreasedRate } from './common/utils'
import {
  TerraswapDataDto,
  TerraswapRecentCycleDto,
  TerraswapRecentDataDto,
  TerraswapRecentVolumeAndLiquidityDto,
  TerraswapSyncedInfo,
} from './dtos/terraswap.dtos'
import { floorTimestamp } from './utils'

@Injectable()
export class DashboardTerraswapService {
  constructor(private readonly repo: DashboardTerraswapRepository) {}

  @memoize({ promise: true, maxAge: 60000, primitive: true, length: 2 })
  async getTerraswapData(from: Date, to: Date): Promise<TerraswapDataDto[]> {
    return await this.repo.getTerraswapData(from, to)
  }

  @memoize({ promise: true, maxAge: 3 * 60 * 1000 })
  async getTerraswapRecentData(): Promise<TerraswapRecentDataDto> {
    const syncInfo = await this.repo.getSyncedBlockAndTimestamp()

    if (!syncInfo.height || !syncInfo.timestamp) {
      throw new NotFoundException(`server is not synced properly`)
    }

    const lastTimestamp = floorTimestamp(syncInfo.timestamp.getTime(), Cycle.HOUR)

    const lastDay = await this.repo.getSumOfVolumesAndLiquidities(
      new Date(lastTimestamp - Cycle.DAY),
      new Date(lastTimestamp)
    )

    if (!lastDay) {
      throw new NotFoundException()
    }

    const dayAgo = await this.repo.getSumOfVolumesAndLiquidities(
      new Date(lastTimestamp - Cycle.DAY * 2),
      new Date(lastTimestamp - Cycle.DAY)
    )
    const lastWeek = await this.repo.getSumOfVolumesAndLiquidities(
      new Date(lastTimestamp - Cycle.WEEK),
      new Date(lastTimestamp)
    )
    const weekAgo = await this.repo.getSumOfVolumesAndLiquidities(
      new Date(lastTimestamp - Cycle.WEEK * 2),
      new Date(lastTimestamp - Cycle.WEEK * 1)
    )

    return {
      daily: this.toRecentCycleDto(lastDay, dayAgo, syncInfo),
      weekly: this.toRecentCycleDto(lastWeek, weekAgo, syncInfo),
    }
  }

  private toRecentCycleDto(
    current: TerraswapRecentVolumeAndLiquidityDto,
    previous: TerraswapRecentVolumeAndLiquidityDto,
    syncInfo: TerraswapSyncedInfo
  ): TerraswapRecentCycleDto {
    const fee = calculateFee(current.volume)
    return {
      volume: current.volume,
      volumeIncreasedRate: calculateIncreasedRate(current.volume, previous.volume),
      liquidity: current.liquidity,
      liquidityIncreasedRate: calculateIncreasedRate(current.liquidity, previous.liquidity),
      fee,
      feeIncreasedRate: calculateIncreasedRate(fee, calculateFee(previous.volume)),
      ...syncInfo,
    }
  }
}
