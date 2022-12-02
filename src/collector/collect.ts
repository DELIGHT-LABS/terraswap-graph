import { EntityManager, getManager } from 'typeorm'
import { delay } from 'bluebird'
import { getTxsByHeight, lcd, oracle } from 'lib/terra'
import { errorHandler } from 'lib/error'
import * as logger from 'lib/logger'
import { getCollectedBlock, updateBlock } from './block'
import { runIndexers } from './indexer'
import { delete24hData } from './deleteOldData'
import { BlockEntity } from '../orm'
import { updateTerraswapData } from './indexer/transferUpdater'

const columbus4EndHeight = 4_724_000

const chainId = process.env.TERRA_CHAIN_ID

export async function collect(
  pairList: Record<string, boolean>,
  tokenList: Record<string, boolean>
): Promise<void> {
  //latest Height or end Height
  const latestBlock = await (chainId === 'columbus-4' ? columbus4EndHeight : lcd.getLatestBlockHeight().catch(errorHandler))

  if (!latestBlock) return

  const collectedBlock = await getCollectedBlock()

  const lastHeight = collectedBlock.height

  // initial exchange rate
  let exchangeRate = await oracle.getExchangeRate(lastHeight - (lastHeight % 100))

  if (latestBlock === lastHeight) {
    if (lastHeight === columbus4EndHeight)
      throw new Error(`columbus-4 ended at height ${columbus4EndHeight}. Please change terraswap graph to the columbus-5 version`)

    await delay(500)
    return
  }

  for (let height = lastHeight + 1; height <= latestBlock; height++) {
    const txs = await getTxsByHeight(height).catch(errorHandler)
    if (!txs) return

    if (height % 100 === 0) {
      exchangeRate = await oracle.getExchangeRate(height)
    }

    await getManager().transaction(async (manager: EntityManager) => {
      if (!(latestBlock === lastHeight && txs[0] === undefined)) {
        if (txs[0] !== undefined) {
          await runIndexers(manager, txs, exchangeRate, pairList, tokenList)
          height % 100 === 0 && await updateTerraswapData(manager)
        }
        await updateBlock(collectedBlock, height, manager.getRepository(BlockEntity))
      }
      await delete24hData(manager, new Date().valueOf())
    })
    if (height % 100 === 0) logger.info(`collected: ${height} / latest height: ${latestBlock}`)
  }
}
