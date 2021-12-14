import { IsNumberString, IsDate, IsString, IsNumber, IsDateString } from 'class-validator'

export class TerraswapDataDto {
  @IsDate()
  timestamp: Date

  @IsNumberString()
  liquidityUst: string

  @IsNumberString()
  volumeUst: string
}

export class TerraswapRecentCycleDto {
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
export class TerraswapRecentDataDto {
  daily: TerraswapRecentCycleDto

  weekly: TerraswapRecentCycleDto
}

export class TerraswapRecentVolumeAndLiquidityDto {
  @IsString()
  volume: string

  @IsString()
  liquidity: string
}

export class TerraswapSyncedInfo {
  @IsNumber()
  height: number

  @IsDateString()
  timestamp: Date 
}