import { Injectable } from '@nestjs/common'
import { DashboardTxsRepository } from 'dashboard/repositories/txs.repository'
import memoize from 'memoizee-decorator'

@Injectable()
export class DashboardTxsService {
  constructor(private readonly repo: DashboardTxsRepository) {}

  @memoize({ promise: true, maxAge: 6000 })
  async getTxs(pair: string, pageOffset?: number): Promise<any> {
    return this.repo.getTxsOfPair(pair, pageOffset)
  }


  @memoize({ promise: true, maxAge: 6000 })
  async getTx(txHash: string): Promise<any> {
    return this.repo.getTx(txHash)
  }
}
