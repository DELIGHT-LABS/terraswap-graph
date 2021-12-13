import { Get, Param, Query } from '@nestjs/common'
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DashboardTxsService } from 'dashboard/services/txs.service'
import { MyController } from '../decorators/controller.decorator'
import { TxParam, TxResponse, TxsQuery, TxsResponse } from '../dtos/txs.dtos'

@MyController('/txs')
@ApiTags('dashboard')
export class TxsController {
  constructor(private readonly service: DashboardTxsService) {}

  @Get('')
  @ApiResponse({ type: TxsResponse })
  @ApiQuery({ type: TxsQuery })
  @ApiQuery({
    name: 'pair',
    description: 'pair address, length 44',
    example: 'terra14fyt2g3umeatsr4j4g2rs8ca0jceu3k0mcs7ry',
  })
  @ApiQuery({ name: 'page', description: 'page number', required: false, example: 10 })
  async getPairTxs(@Query() query: TxsQuery): Promise<TxsResponse> {
    const pageOffset = query.page ? Number(query.page) - 1 : 0
    return this.service.getTxs(query.pair, pageOffset)
  }

  @Get('/:txHash')
  @ApiResponse({ type: TxResponse })
  @ApiParam({
    name: 'txHash',
    description: 'txHash for page nation, required when page is provided',
    required: false,
    example: '5776F49B83911D84FE7318B772FA45715BC9353E17687B7C706F6209A1D91085',
  })
  async getPairTx(@Param() dto: TxParam): Promise<TxResponse> {
    return this.service.getTx(dto.txHash)
  }
}
