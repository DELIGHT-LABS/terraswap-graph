import { IsDateString, IsNumber, IsNumberString, IsString } from 'class-validator'
import { TokenDto, Volume24hDto } from './dtos'

export type PairsDtos = PairsDto[]

export class PairsDto {
  pairAddress: string

  timestamp: Date

  token0: string

  token0Symbol: string

  token0Decimals: number

  token1: string

  token1Symbol: string

  token1Decimals: number

  token0Volume: string

  token1Volume: string

  token0Reserve: string

  token1Reserve: string

  totalLpTokenShare: string

  volumeUst: string

  liquidityUst: string

  apr: string
}

export class PairResponse {
  pairAddress: string

  token0: TokenDto

  token1: TokenDto

  token0Price: string

  token1Price: string

  latestLiquidityUst: string

  lpTokenAddress: string

  commissionApr: string

  volume24h: Volume24hDto

  volumes: string[]

  liquidities: string[]
}

export class PairDto {
  constructor() {
    this.token0 = new TokenDto()
    this.token1 = new TokenDto()
    this.volume24h = new Volume24hDto()
    this.volumes = []
    this.liquidities = []
  }
  pairAddress: string

  token0: TokenDto

  token1: TokenDto

  token0Reserve: string

  token1Reserve: string

  latestLiquidityUst: string

  lpTokenAddress: string

  volume24h: Volume24hDto

  volumes: VolumeDto[]

  liquidities: LiquidityDto[]
}

export class VolumeDto {
  timestamp: Date

  volume: string
}

export class LiquidityDto {
  timestamp: Date

  liquidity: string
}

export class PairRecentCycleDto {
  @IsNumberString()
  volume: string

  @IsNumberString()
  volumeIncreasedRate: string

  @IsNumberString()
  liquidity: string

  @IsNumberString()
  liquidityIncreasedRate: string

  @IsNumberString()
  fee: string

  @IsNumberString()
  feeIncreasedRate: string

  @IsNumber()
  height: number

  @IsDateString()
  timestamp: Date 
}
export class PairRecentDataDto {
  daily: PairRecentCycleDto

  weekly: PairRecentCycleDto
}

export class PairRecentVolumeAndLiquidityDto {
  @IsString()
  volume: string

  @IsString()
  liquidity: string
}

export class PairsSyncedInfo {
  @IsNumber()
  height: number

  @IsDateString()
  timestamp: Date 
}