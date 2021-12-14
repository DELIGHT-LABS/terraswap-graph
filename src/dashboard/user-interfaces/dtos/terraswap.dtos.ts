import { ApiResponseProperty } from '../decorators/api-property.decorator'
import { IsOptional, IsDate } from 'class-validator'
import { Type } from 'class-transformer'
import { TerraswapRecentDataDto } from 'dashboard/services/dtos/terraswap.dtos'

export class TerraswapQuery {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from: Date

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to: Date
}

export class TerraswapDataResponse {
  @ApiResponseProperty({ example: '2021-11-04', type: String, format: 'date' })
  timestamp: Date

  @ApiResponseProperty({ example: '110079649300112', type: String })
  volumeUst: string

  @ApiResponseProperty({ example: '1307281629942463', type: String })
  liquidityUst: string
}

export type TerraswapDataResponses = TerraswapDataResponse[]

export class TerraswapRecentCycleResponse {
  @ApiResponseProperty({ example: '110079649300112', type: String })
  volume: string

  @ApiResponseProperty({ example: '0.234', type: String })
  volumeIncreasedRate: string

  @ApiResponseProperty({ example: '1307281629942463', type: String })
  liquidity: string

  @ApiResponseProperty({ example: '0.34', type: String })
  liquidityIncreasedRate: string

  @ApiResponseProperty({ example: '330238947900', type: String })
  fee: string

  @ApiResponseProperty({ examples: ['0.24832', 'Infinity'], type: String })
  feeIncreasedRate: string

  @ApiResponseProperty({ example: '5667522', type: Number })
  height: number

  @ApiResponseProperty({ example: '2021-12-14T02:00:00.000Z' })
  timestamp: Date 
}

export class TerraswapRecentDataResponse extends TerraswapRecentDataDto {
  @ApiResponseProperty({ type: TerraswapRecentCycleResponse })
  daily: TerraswapRecentCycleResponse

  @ApiResponseProperty({ type: TerraswapRecentCycleResponse })
  weekly: TerraswapRecentCycleResponse
}
