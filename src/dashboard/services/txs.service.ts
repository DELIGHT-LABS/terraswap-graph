import { Injectable } from '@nestjs/common'
import { DashboardTxsRepository } from 'dashboard/repositories/txs.repository'
import memoize from 'memoizee-decorator'

@Injectable()
export class DashboardTxsService {
  constructor(private readonly repo: DashboardTxsRepository) {}

  @memoize({ promise: true, maxAge: 6000 })
  async getTxs(pair: string, page?: number): Promise<any> {
    return this.repo.getTxsOfPair(pair, page)
  }
}
