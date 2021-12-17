import { Get, Param } from '@nestjs/common'
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DashboardPairsService } from 'dashboard/services/pairs.service'
import { MyController } from '../decorators/controller.decorator'
import {
  PairRecentDataResponse,
  PairResponse,
  PairsParam,
  PairsResponse,
  PairsResponses,
} from '../dtos/pairs.dtos'

@MyController('/pairs')
@ApiTags('dashboard')
export class PairsController {
  constructor(private readonly service: DashboardPairsService) {}

  @Get()
  @ApiResponse({ type: [PairsResponse] })
  async getPairs(): Promise<PairsResponses> {
    const dtos = await this.service.getPairs()
    return dtos.map((dto) => {
      return {
        ...dto,
        pairAlias: `${dto.token0Symbol}-${dto.token1Symbol}`,
      }
    })
  }

  @Get('/:pairAddress/recent')
  @ApiResponse({ type: PairRecentDataResponse })
  async getRecentDataOfPair(
    @Param() dto: PairsParam
  ): Promise<PairRecentDataResponse> {
    return await this.service.getRecentData(dto.pairAddress)
  }

  @Get('/:address')
  @ApiParam({ name: 'address', example: 'terra1a5cc08jt5knh0yx64pg6dtym4c4l8t63rhlag3' })
  @ApiResponse({ type: PairResponse })
  async getPair(@Param('address') addr: string): Promise<PairResponse> {
    const dtos = await this.service.getPair(addr)
    return dtos
  }
}
