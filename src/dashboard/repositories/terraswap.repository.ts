import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import {
  TerraswapDataDto,
  TerraswapRecentVolumeAndLiquidityDto,
  TerraswapSyncedInfo,
} from 'dashboard/services/dtos/terraswap.dtos'
import { BlockEntity, PairDayDataEntity, PairHourDataEntity, TerraswapDayDataEntity } from 'orm'
import { getConnection, getManager } from 'typeorm'

@Injectable()
export class DashboardTerraswapRepository {
  async getTerraswapData(from: Date, to: Date): Promise<TerraswapDataDto[]> {
    try {
      const data = await getManager()
        .getRepository(TerraswapDayDataEntity)
        .createQueryBuilder('t')
        .select('t.timestamp', 'timestamp')
        .addSelect('t.volumeUst', 'volumeUst')
        .addSelect('t.totalLiquidityUst', 'liquidityUst')
        .where('t.timestamp >= :from', { from })
        .andWhere('t.timestamp <= :to', { to })
        .orderBy('t.timestamp', 'DESC')
        .getRawMany()
      return data
    } catch (err: any) {
      Logger.warn(`getTerraswapData err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  async getSyncedBlockAndTimestamp(): Promise<TerraswapSyncedInfo> {
    const bRepo = getManager().getRepository(BlockEntity)
    const phRepo = getManager().getRepository(PairHourDataEntity)
    try {
      const { height } = await bRepo.findOne({ select: ['height'] })
      const { timestamp } = await phRepo.findOne({
        select: ['timestamp'],
        order: {
          timestamp: 'DESC',
        },
      })

      return { height, timestamp }
    } catch (err: any) {
      Logger.warn(`getSyncedBlockAndTimestamp err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  /**
   * (from, to]
   * @param from excluded 
   * @param to included 
   */
  async getSumOfVolumesAndLiquidities(
    from: Date,
    to: Date
  ): Promise<TerraswapRecentVolumeAndLiquidityDto> {
    const volume = await this.getSumOfVolumes(from, to)
    const liquidity = await this.getTvl(to)

    return { volume, liquidity }
  }

  private async getSumOfVolumes(from: Date, to: Date): Promise<string> {
    try {
      const { volume } = await getManager().getRepository(PairHourDataEntity)
        .createQueryBuilder('p')
        .select('SUM(p.volumeUst)', 'volume')
        .where('p.timestamp <=:to', { to })
        .andWhere('p.timestamp >:from', { from })
        .getRawOne()

      return volume
    } catch (err: any) {
      Logger.warn(`getSumOfVolumes err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  private async getTvl(targetTime: Date): Promise<string> {
    try {
      const { liquidity } = await getConnection()
        .createQueryBuilder()
        .select('SUM(tmp.liquidity)', 'liquidity')
        .from((subQb) => {
          return subQb
            .select('p.liquidityUst', 'liquidity')
            .from(PairDayDataEntity, 'p')
            .where('p.timestamp <=:targetTime', { targetTime })
            .distinctOn(['p.pair'])
            .orderBy('p.pair')
            .addOrderBy('p.timestamp', 'DESC')
        }, 'tmp')
        .getRawOne()

      return liquidity
    } catch (err: any) {
      Logger.warn(`getTvl err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }
}
