import axios from 'axios'
import * as http from 'http';
import * as https from 'https';
import { isNative } from 'lib/utils';
import { Lcd, TokenInfo } from './interfaces';

export class ClassicLcd implements Lcd {

  private lcdUrl = process.env.TERRA_LCD || 'https://columbus-lcd.terra.dev'

  private classicLcd = axios.create({
    baseURL: this.lcdUrl,
    httpAgent: new http.Agent({ keepAlive: true, maxTotalSockets: 5, keepAliveMsecs: 5 * 1000 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxTotalSockets: 5 }),
    timeout: 2 * 1000,
  })

  async getLatestBlockHeight(): Promise<number> {
    const res = await this.classicLcd.get(`/blocks/latest`)
    return parseInt(res.data.block.header.height)
  }

  async getTokenInfo(address: string): Promise<TokenInfo> {
    if (isNative(address)) {
      return {
        symbol: address,
        decimals: 6,
      }
    }

    const result = await this.classicLcd.get(`terra/wasm/v1beta1/contracts/${address}/store`,
      {
        params: {
          query_msg: 'eyJ0b2tlbl9pbmZvIjp7fX0='
        }
      })

    return result.data?.query_result
  }
}

