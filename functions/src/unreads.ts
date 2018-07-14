/*
 * User processing
 */
import * as shared from './shared'
type DataSnapshot = shared.DataSnapshot

export async function onWriteUnread(data: DataSnapshot, context) {
  if (!context.params) { return }
  const userId = context.params.userId
  const countRef = shared.database.ref(`/counters/${userId}/unreads`)

  try {
    await countRef.transaction((current) => {
      return (current || 0) + 1
    })
  } catch (err) {
    console.error(`Error changing unread count: ${err.message}`)
  }
}

export async function onDeleteUnread(data: DataSnapshot, context) {
  if (!context.params) { return }
  const userId = context.params.userId
  const countRef = shared.database.ref(`/counters/${userId}/unreads`)

  try {
    await countRef.transaction((current) => {
      return (current || 0) - 1
    })
  } catch (err) {
    console.error(`Error changing unread count: ${err.message}`)
  }
}

export async function onWriteUnreadsCounter(data: DataSnapshot, context) {
  if (data.exists()) { return }
  if (!context.params) { return }
  const userId = context.params.userId
  const countRef = shared.database.ref(`/counters/${userId}/unreads`)
  const unreadsRef = shared.database.ref(`/unreads/${userId}`)

  try {
    let count = 0
    const channels: DataSnapshot = await unreadsRef.once('value')
    channels.forEach((channel) => {
      count += channel.numChildren()
      return false
    })
    await countRef.set(count)
    console.log(`Recounting unreads for ${userId} total ${count}`)
  } catch (err) {
    console.error(`Error counting unreads: ${err.message}`)
  }
}