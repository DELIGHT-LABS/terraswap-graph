import { BigNumber } from "lib/num";
import { TERRASWAP_SWAP_FEE_RATE } from "./defined";

export function calculateFee(volume:string): string  {
    if (!volume) {
        return "0"
    }
    return new BigNumber(volume).multipliedBy(TERRASWAP_SWAP_FEE_RATE).integerValue().toString()
}

export function calculateIncreasedRate(current: string, prev: string): string {
    if (!prev) {
        return "0"
    }
    return new BigNumber(current).dividedBy(prev).minus(1).toString()
}