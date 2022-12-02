import { EntityManager } from 'typeorm'
import { Tx, ExchangeRate } from 'types'
import { generateTerraswapRow } from './txHistoryUpdater'
import { createCreatePairLogFinders, createSPWFinder, createNativeTransferLogFinders, createNonnativeTransferLogFinder } from '../log-finder'
import { CreatePairIndexer } from './createPairIndexer'
import { TxHistoryIndexer } from './txHistoryIndexer'
import { NativeTransferIndexer, NonnativeTransferIndexer } from './transferIndexer'
import { factoryAddress } from 'lib/terraswap/'
import logRules from '../log-finder/log-rules'


const createPairLF = createCreatePairLogFinders(factoryAddress)
const nativeTransferLF = createNativeTransferLogFinders()
const nonnativeTransferLF = createNonnativeTransferLogFinder()

export async function runIndexers(
  manager: EntityManager,
  txs: Tx[],
  exchangeRate: ExchangeRate | undefined,
  pairList: Record<string, boolean>,
  tokenList: Record<string, boolean>
): Promise<void> {
  for (const tx of txs) {
    const Logs = tx.logs
    const timestamp = tx.timestamp
    const txHash = tx.txhash

    for (const log of Logs) {
      const events = log.events

      for (const event of events) {
        // for spam tx
        if (logRules.isParsable(event.type)) {
          // createPair
          const createPairLogFounds = createPairLF(event)
          createPairLogFounds.length > 0 && await CreatePairIndexer(pairList, tokenList, manager, timestamp, createPairLogFounds)

          // txHistory
          const spwfLF = createSPWFinder(pairList)
          const spwfLogFounds = spwfLF(event)

          spwfLogFounds.length > 0 && await TxHistoryIndexer(manager, exchangeRate, timestamp, txHash, spwfLogFounds)

          // native transfer
          const nativeTransferLogFounds = nativeTransferLF(event)

          await NativeTransferIndexer(pairList, manager, exchangeRate, timestamp, nativeTransferLogFounds)

          // nonnative transfer
          const nonnativeTransferLogFounds = nonnativeTransferLF(event)

          await NonnativeTransferIndexer(pairList, tokenList, manager, timestamp, exchangeRate, nonnativeTransferLogFounds)
        }
      }
    }
  }

  if (txs[0]) {
    generateTerraswapRow(txs[0].timestamp, manager)
  }
}
