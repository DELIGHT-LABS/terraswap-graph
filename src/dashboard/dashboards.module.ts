import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { DashboardRepositoriesModule } from './repositories/dashboard-repositories.module'
import { DashboardServicesModule } from './services/dashboard-services.module'
import { PairsController } from './user-interfaces/controllers/pairs.controller'
import { TerraswapController } from './user-interfaces/controllers/terraswap.controller'
import { TxsController } from './user-interfaces/controllers/txs.controller'
import { DashboardUserInterfacesModule } from './user-interfaces/dashboard-user-interfaces.module'

@Module({
  imports: [
    DashboardRepositoriesModule,
    DashboardServicesModule,
    DashboardUserInterfacesModule,
    RouterModule.register([
      { path: `${process.env.API_VERSION ? process.env.API_VERSION : "v1"}`, module: DashboardUserInterfacesModule }
    ]),
  ],
  controllers: [TerraswapController, PairsController, TxsController],
})
export class DashboardsModule { }
