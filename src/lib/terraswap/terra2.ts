import * as http from 'http';
import * as https from 'https';

import axios, { Axios, AxiosRequestHeaders } from "axios";
import { factoryAddress, Pair, PairRes, PoolInfoRes } from './terraswap';

export class PhoenixTerraswap {
    private readonly USX_ADDR = process.env.STABLE_COIN_ADDR;
    private axios: Axios;
    constructor(lcdUrl = process.env.TERRA_LCD) {
        this.axios = axios.create({
            baseURL: lcdUrl,
            httpAgent: new http.Agent({ keepAlive: true, maxTotalSockets: 5, keepAliveMsecs: 5 * 1000 }),
            httpsAgent: new https.Agent({ keepAlive: true, maxTotalSockets: 5 }),
            timeout: 2 * 1000,
        })
    }

    async getPoolBalance(pair: string, height?: number): Promise<PoolInfoRes> {
        const data = { pool: {} }
        return await this.queryContract(pair, data, height)
    }

    async getAllPairs(height?: number): Promise<Pair[]> {
        const pairs: PairRes[] = [];
        let current: PairRes[] = [];
        do {
            pairs.push(...current)
            const queryStr = `{"pairs": { "limit": 30 ${pairs.length ? `,"start_after":${JSON.stringify(pairs.at(-1).asset_infos)}` : ""} }}`
            const data = Buffer.from(queryStr).toString('base64')
            current = (await this.queryContract(factoryAddress, data, height))?.pairs
        } while (current?.length !== 0)
        return pairs.map(p => ({
            addr: p.contract_addr,
            lp: p.liquidity_token,
            lpAmount: "0",
            assets: p.asset_infos.map(
                (a, idx) => ({
                    addr: a.token?.contract_addr ?? a.native_token?.denom,
                    decimals: p.asset_decimals[idx],
                    amount: "0",
                })
            )
        }))
    }

    private async queryContract(contract: string, data: any, height?: number) {
        if (typeof data !== 'string') {
            data = Buffer.from(JSON.stringify(data)).toString('base64')
        }
        const headers: AxiosRequestHeaders = {
            'Content-Type': 'application/json',
            'x-cosmos-block-height': `${height}`
        }
        const res = await this.axios.get(`/cosmwasm/wasm/v1/contract/${contract}/smart/${data}`, { headers })
        return res.data.data
    }
}
