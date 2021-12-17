import { PairQueryUnit } from 'dashboard/services/dtos/dtos'
import { PairDataEntity, PairDayDataEntity, PairHourDataEntity } from 'orm'
import { EntityManager, Repository } from 'typeorm'

export class PairDataRepoFactory {
  static GetPairRepo(manager: EntityManager, qUnit: PairQueryUnit): Repository<PairDataEntity> {
        switch (qUnit) {
        case PairQueryUnit.Hour:
            return manager.getRepository(PairHourDataEntity)
        case PairQueryUnit.Day:
            return manager.getRepository(PairDayDataEntity)
        }
  }
}
