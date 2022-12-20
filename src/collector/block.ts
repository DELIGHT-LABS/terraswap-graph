import { getRepository } from 'typeorm'
import { BlockEntity } from 'orm'
import config from 'config'

export async function getLastBlock(): Promise<BlockEntity | void> {
  return getRepository(BlockEntity).findOne({ order: { id: 'DESC' } })
}

export async function getCollectedBlock(): Promise<BlockEntity> {
    let block = await getLastBlock()
    if (!block) {
      block =  await getRepository(BlockEntity).save({ height: config.START_BLOCK_HEIGHT })
    }
    return block
}

export async function updateBlock(
  block: BlockEntity,
  height: number,
  repo = getRepository(BlockEntity)
): Promise<void> {
  block.height = height
  const res = await repo.update({height: height - 1}, block)
  if (res.affected === 0)  {
    throw new Error(`Block ${height - 1} not found`)
  }
}
