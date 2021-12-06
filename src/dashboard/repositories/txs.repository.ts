import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { TxHistoryEntity } from 'orm'
import { getManager, getRepository } from 'typeorm'
import { TXS_PAGINATED_COUNT } from './defined'

@Injectable()
export class DashboardTxsRepository {
  async getTxsOfPair(pair: string, page = 0): Promise<any> {
    const repo = getManager().getRepository(TxHistoryEntity)

    try {
      const ret: any = {}
      ret.txs = await repo
        .createQueryBuilder('t')
        .select('t.pair', 'pairAddress')
        .addSelect('t.timestamp', 'timestamp')
        .addSelect('t.tx_hash', 'txHash')
        .addSelect('t.action', 'action')
        .addSelect('t.token0Amount', 'token0Amount')
        .addSelect('t.token1Amount', 'token1Amount')
        .addSelect('t.id', 'id')
        .where('t.pair=:pair', { pair })
        .orderBy('t.id', 'DESC')
        .skip(TXS_PAGINATED_COUNT * page)
        .take(TXS_PAGINATED_COUNT)
        .execute()

      ret.totalCount = await repo.count({ where: { pair } })
      return ret
    } catch (err: any) {
      Logger.warn(`getTerraswapRecentData err:${err.stack ? err.stack : err}`)
      throw new InternalServerErrorException(`internal server error`)
    }
  }

  private async getId(hash: string): Promise<string> {
    return (await getRepository(TxHistoryEntity).findOne({ tx_hash: hash })).id
  }
}
