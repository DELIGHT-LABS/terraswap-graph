import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { DashboardRepositoriesModule } from './repositories/dashboard-repositories.module'
import { DashboardServicesModule } from './services/dashboard-services.module'
import { DashboardUserInterfacesModule } from './user-interfaces/dashboard-user-interfaces.module'

@Module({
  imports: [DashboardRepositoriesModule, DashboardServicesModule, DashboardUserInterfacesModule,
    RouterModule.register([{ path: 'dashboard', module: DashboardUserInterfacesModule }])],
})
export class DashboardsModule {}
