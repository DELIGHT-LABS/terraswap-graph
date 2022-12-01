import { delay } from 'bluebird'
import { num } from 'lib/num'
import fetch from 'node-fetch'
import { ExchangeRate } from 'types'
import { Oracle } from './interfaces'

export class ClassicOracle implements Oracle {
  async getExchangeRate(height: number): Promise<ExchangeRate> {
    if (Number(process.env.START_BLOCK_HEIGHT) + 100 > height) height += 100
    let res = await this.getFromLCD('/oracle/denoms/exchange_rates?height=' + height.toString())
    if (res && !res.result) {
      let index = 1
      while (!res.result) {
        res = await this.getFromLCD(
          '/oracle/denoms/exchange_rates?height=' + (height - index * 100).toString()
        )
        index++
      }
    }
    return res
  }

  async exchangeRateToUSX(
    denom: string,
    inputExchangeRate: ExchangeRate | undefined
  ): Promise<string | undefined> {
    let exchangeRate = inputExchangeRate
    if (!exchangeRate) return
    if (denom === 'uluna') return exchangeRate.result.filter((e) => e.denom === 'uusd')[0].amount
    if (!exchangeRate.result.filter((e) => e.denom === denom)[0]) {
      while (!exchangeRate.result.filter((e) => e.denom === denom)[0]) {
        exchangeRate = await this.getExchangeRate(Number(exchangeRate.height) - 100)
        if (denom === 'uust') {
          return '0'
        }
      }
    }
    if (denom === 'uusd') return '1'
    const uusdRate = exchangeRate.result.filter((e) => e.denom === 'uusd')[0].amount
    const targetDenomRate = exchangeRate.result.filter((e) => e.denom === denom)[0].amount
    return num(uusdRate).div(targetDenomRate).toString()
  }

  private async getFromLCD(leftover: string, baseURL = process.env.TERRA_LCD): Promise<ExchangeRate> {
    let got = false
    while (!got) {
      try {
        const res = await fetch(baseURL + leftover, {
          headers: {
            accept: 'application/json',
          },
        }).catch()
        got = true
        return res.json()
      } catch (error) {
        delay(1000)
        throw error
      }
    }
  }
}
