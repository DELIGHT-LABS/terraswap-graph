import { IsString, Length, Validate } from 'class-validator'
import {
  LiquidityDto,
  PairDto,
  PairRecentDataDto,
  PairsDto,
  VolumeDto,
} from 'dashboard/services/dtos/pairs.dtos'
import { ApiResponseProperty } from '../decorators/api-property.decorator'
import { TokenResponse } from './tokens.dtos'

import { Volume24hResponse } from './tokens.dtos'


export class PairsParam {
  @IsString()
  @Validate((pairAddress: string)=>{
    return pairAddress.startsWith('terra1')
  })
  @Length(44,44)
  pairAddress: string
}


export type PairsResponses = PairsResponse[]
export class PairsResponse extends PairsDto {
  @ApiResponseProperty({
    description: 'the unique address of a pair',
    example: 'terra1ndvg44ygupqwq8xqzvtyqjq7agl50wwfpm0jfq',
  })
  pairAddress: string

  @ApiResponseProperty({
    description: `combination of tokens' symbol`,
    example: 'ANC-UST',
  })
  pairAlias: string

  @ApiResponseProperty({
    description: 'timestamp of a specific day',
    example: '2021-11-10 00:00:00',
  })
  timestamp: Date

  @ApiResponseProperty({
    description: `the unique address or denom`,
    example: 'terra1nl9dx4pkat90gzw2j99n338n984e4cw7nxq65w',
  })
  token0: string

  @ApiResponseProperty({ description: `the unique address or denom`, example: 'uusd' })
  token1: string

  @ApiResponseProperty({ example: 'uusd' })
  token0Symbol: string

  @ApiResponseProperty({ example: 6 })
  token0Decimals: number

  @ApiResponseProperty({ example: 'tokenSymbol' })
  token1Symbol: string

  @ApiResponseProperty({ example: 8 })
  token1Decimals: number

  @ApiResponseProperty({ description: "Token 0's daily volume", example: '1020000000' })
  token0Volume: string

  @ApiResponseProperty({ description: "Token 1's daily volume", example: '984621790098' })
  token1Volume: string

  @ApiResponseProperty({ description: "Token 0's daily reserved", example: '62212902054' })
  token0Reserve: string

  @ApiResponseProperty({ description: "Token 1's daily reserved", example: '59120646029299' })
  token1Reserve: string

  @ApiResponseProperty({ description: 'the number of total lp shared', example: '1937579070265' })
  totalLpTokenShare: string

  @ApiResponseProperty({ example: '1020000000' })
  volumeUst: string

  @ApiResponseProperty({ example: '124425804108' })
  liquidityUst: string

  @ApiResponseProperty({ example: '0.2' })
  apr: string
}

export class VolumeResponse extends VolumeDto {
  @ApiResponseProperty({ example: '2021-10-11T00:00:00.000Z' })
  timestamp: Date

  @ApiResponseProperty({ example: '562004967231' })
  volume: string
}

export class LiquidityResponse extends LiquidityDto {
  @ApiResponseProperty({ example: '2021-09-30T00:00:00.000Z' })
  timestamp: Date

  @ApiResponseProperty({ example: '10022004967231' })
  liquidity: string
}

export class PairResponse extends PairDto {
  @ApiResponseProperty({ example: 'terra14fyt2g3umeatsr4j4g2rs8ca0jceu3k0mcs7ry' })
  pairAddress: string

  @ApiResponseProperty({
    type: TokenResponse,
    example: {
      tokenAddress: 'uusd',
      symbol: 'uusd',
      price: '108219018452',
    },
  })
  token0: TokenResponse

  @ApiResponseProperty({ type: TokenResponse })
  token1: TokenResponse

  @ApiResponseProperty({ example: 'terra1veqh8yc55mhw0ttjr5h6g9a6r9nylmrc0nzhr7' })
  lpTokenAddress: string

  @ApiResponseProperty({ type: Volume24hResponse })
  volume24h: Volume24hResponse

  @ApiResponseProperty({
    description: 'volumes of latest 50 days',
    type: [VolumeResponse],
    maxItems: 50,
  })
  volumes: VolumeResponse[]

  @ApiResponseProperty({
    description: 'liquidities of latest 50 days',
    type: [LiquidityResponse],
    maxItems: 50,
  })
  liquidities: LiquidityResponse[]
}

export class PairRecentCycleResponse {
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

export class PairRecentDataResponse extends PairRecentDataDto {
  @ApiResponseProperty({ type: PairRecentCycleResponse })
  daily: PairRecentCycleResponse

  @ApiResponseProperty({ type: PairRecentCycleResponse })
  weekly: PairRecentCycleResponse
}
