import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { Volume24hDto } from 'dashboard/services/dtos/dtos'
import {
  PairDto,
  PairRecentVolumeAndLiquidityDto,
  PairsDtos,
  PairsSyncedInfo,
} from 'dashboard/services/dtos/pairs.dtos'
import { floorTimestamp } from 'dashboard/services/utils'
import {
  BlockEntity,
  PairDayDataEntity,
  PairHourDataEntity,
  PairInfoEntity,
  Recent24hEntity,
  TokenInfoEntity,
} from 'orm'
import { getConnection, getManager, getRepository, LessThanOrEqual } from 'typeorm'
import { Cycle } from 'types'
import { PAIR_DATA_MAX_DAY_RANGE } from './defined'
import { pairEntity, volumesAndLiquidities } from './dtos/pairs.dtos'

@Injectable()
export class DashboardPairsRepository {
  async getPairsLatestData(): Promise<PairsDtos> {
    const repo = getManager().getRepository(PairDayDataEntity)
    try {
      const dtos: PairsDtos = await repo
        .createQueryBuilder('p')
        .innerJoinAndSelect(TokenInfoEntity, 't0', 'p.token0=t0.tokenAddress')
        .innerJoinAndSelect(TokenInfoEntity, 't1', 'p.token1=t1.tokenAddress')
        .distinctOn(['p.pair'])
        .orderBy('p.pair')
        .addOrderBy('p.timestamp', 'DESC')
        .select('p.pair', 'pairAddress')
        .addSelect('p.timestamp', 'timestamp')
        .addSelect('p.token0', 'token0')
        .addSelect('p.token1', 'token1')
        .addSelect('p.token0Volume', 'token0Volume')
        .addSelect('p.token1Volume', 'token1Volume')
        .addSelect('p.token0Reserve', 'token0Reserve')
        .addSelect('p.token1Reserve', 'token1Reserve')
        .addSelect('p.totalLpTokenShare', 'totalLpTokenShare')
        .addSelect('p.volumeUst', 'volumeUst')
        .addSelect('p.liquidityUst', 'liquidityUst')
        .addSelect('t0.symbol', 'token0Symbol')
        .addSelect('t1.symbol', 'token1Symbol')
        .addSelect('t0.decimals', 'token0Decimals')
        .addSelect('t1.decimals', 'token1Decimals')
        .execute()
      return dtos
    } catch (err: any) {
      Logger.warn(`getTerraswapRecentData err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  async getLastWeekVolumes(
    targetTimeStamp: number = Date.now()
  ): Promise<{ pairAddress: string; volume: string }[]> {
    const repo = getManager().getRepository(PairDayDataEntity)
    try {
      const lastDayTimestamp = floorTimestamp(targetTimeStamp, Cycle.DAY)
      const volumes: { pairAddress: string; volume: string }[] = await repo
        .createQueryBuilder('p')
        .groupBy('p.pair')
        .andWhere('p.timestamp >=:from', { from: new Date(lastDayTimestamp - Cycle.WEEK) })
        .andWhere('p.timestamp <:lastDay', { lastDay: new Date(lastDayTimestamp) })
        .select('p.pair', 'pairAddress')
        .addSelect('SUM(p.volumeUst)', 'volume')
        .orderBy('p.pair', 'ASC')
        .getRawMany()
      return volumes
    } catch (err: any) {
      Logger.warn(`err ${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  async getLatestLiquidities(
    targetTimeStamp: number = Date.now()
  ): Promise<{ pairAddress: string; liquidityUst: string }[]> {
    const repo = getManager().getRepository(PairDayDataEntity)
    try {
      const lastDayTimestamp = floorTimestamp(targetTimeStamp, Cycle.DAY)
      const liquidities: { pairAddress: string; liquidityUst: string }[] = await repo
        .createQueryBuilder('p')
        .distinctOn(['p.pair'])
        .orderBy('p.pair')
        .addOrderBy('p.timestamp', 'DESC')
        .where('p.timestamp >=:weekAgo', { weekAgo: new Date(lastDayTimestamp - Cycle.WEEK) })
        .andWhere('p.timestamp <:lastDay', { lastDay: new Date(lastDayTimestamp) })
        .select('p.liquidityUst', 'liquidityUst')
        .addSelect('p.pair', 'pairAddress')
        .getRawMany()
      return liquidities
    } catch (err: any) {
      Logger.warn(`err ${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  async getPair(addr: string): Promise<PairDto> {
    const now = floorTimestamp(Date.now(), Cycle.DAY)
    const repo = getManager().getRepository(PairDayDataEntity)
    try {
      const pair: pairEntity = await repo
        .createQueryBuilder('p')
        .innerJoinAndSelect(PairInfoEntity, 'pi', 'p.pair=pi.pair')
        .innerJoinAndSelect(TokenInfoEntity, 't0', 'p.token0=t0.tokenAddress')
        .innerJoinAndSelect(TokenInfoEntity, 't1', 'p.token1=t1.tokenAddress')
        .select('p.pair', 'pairAddress')
        .addSelect('p.token0', 'token0Address')
        .addSelect('p.token1', 'token1Address')
        .addSelect('p.token0Reserve', 'token0Reserve')
        .addSelect('p.token1Reserve', 'token1Reserve')
        .addSelect('t0.symbol', 'token0Symbol')
        .addSelect('t1.symbol', 'token1Symbol')
        .addSelect('t0.decimals', 'token0Decimals')
        .addSelect('t1.decimals', 'token1Decimals')
        .addSelect('pi.lpToken', 'lpTokenAddress')
        .where('p.pair=:addr', { addr })
        .orderBy('p.timestamp', 'DESC')
        .getRawOne()

      if (!pair) {
        return
      }

      const volumes: volumesAndLiquidities[] = await repo
        .createQueryBuilder('p')
        .select('p.volumeUst', 'volume')
        .addSelect('p.liquidityUst', 'liquidityUst')
        .addSelect('p.timestamp', 'timestamp')
        .where('p.pair=:addr', { addr })
        .andWhere('p.timestamp >=:from', { from: new Date(now - PAIR_DATA_MAX_DAY_RANGE) })
        .orderBy('p.timestamp')
        .getRawMany()

      const dto = this.pairEntityToDtoMap(pair)
      volumes.forEach((v) => {
        dto.volumes.push({ volume: v.volume, timestamp: v.timestamp })
        dto.liquidities.push({ liquidity: v.liquidityUst, timestamp: v.timestamp })
      })

      return dto
    } catch (err: any) {
      Logger.warn(`err ${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  async get24hVolume(pairAddr: string): Promise<Volume24hDto> {
    try {
      return await getRepository(Recent24hEntity)
        .createQueryBuilder('r')
        .select('SUM(r.volumeUst)', 'volumeUST')
        .addSelect('SUM(r.token0Volume)', 'token0Volume')
        .addSelect('SUM(r.token1Volume)', 'token1Volume')
        .where('r.pair =:pairAddr', { pairAddr })
        .cache(60 * 1000)
        .getRawOne()
    } catch (err: any) {
      Logger.warn(`err ${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  async getSyncedBlockAndTimestamp(pairAddress: string): Promise<PairsSyncedInfo | undefined> {
    try {
      const manager = getManager()
      const bEntity = await manager.getRepository(BlockEntity).findOne({ select: ['height'] })
      const pEntity = await manager.getRepository(PairHourDataEntity).findOne({
        select: ['timestamp'],
        where: {
          pair: pairAddress,
        },
        order: {
          timestamp: 'DESC',
        },
      })
      if (!bEntity?.height || !pEntity?.timestamp) {
        return
      }
      return { height: bEntity.height, timestamp: pEntity.timestamp }
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
  async getSumOfVolumesAndLiquidity(
    pairAddress: string,
    from: Date,
    to: Date
  ): Promise<PairRecentVolumeAndLiquidityDto> {
    const volume = await this.getSumOfVolumes(pairAddress, from, to)
    const liquidity = await this.getTvl(pairAddress, to)

    return { volume, liquidity }
  }

  private async getSumOfVolumes(pairAddress: string, from: Date, to: Date): Promise<string> {
    try {
      const entity = await getRepository(PairHourDataEntity)
        .createQueryBuilder('p')
        .select('SUM(p.volumeUst)', 'volume')
        .where('p.timestamp <=:to', { to })
        .andWhere('p.timestamp >:from', { from })
        .andWhere('p.pair =:pairAddress', { pairAddress })
        .getRawOne()

      return entity?.volume || "0"
    } catch (err: any) {
      Logger.warn(`getSumOfVolumes err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  private async getTvl(pairAddress: string, targetTime: Date): Promise<string> {
    try {
      const entity = await getConnection()
        .createQueryBuilder()
        .select('p.liquidityUst', 'liquidity')
        .from(PairHourDataEntity, 'p')
        .where('p.pair = :pairAddress', { pairAddress })
        .andWhere('p.timestamp <=:targetTime', { targetTime })
        .limit(1)
        .getRawOne()
        
      return entity?.liquidity || '0'
    } catch (err: any) {
      Logger.warn(`getTvl err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  private pairEntityToDtoMap(entity: pairEntity): PairDto {
    const dto = new PairDto()

    dto.lpTokenAddress = entity.lpTokenAddress
    dto.pairAddress = entity.pairAddress

    dto.token0.tokenAddress = entity.token0Address
    dto.token0.symbol = entity.token0Symbol
    dto.token0Reserve = entity.token0Reserve

    dto.token1.tokenAddress = entity.token1Address
    dto.token1.symbol = entity.token1Symbol
    dto.token1Reserve = entity.token1Reserve

    return dto
  }
}
