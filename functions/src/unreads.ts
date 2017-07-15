/*
 * User processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot

export async function onWriteUnread(event: shared.DatabaseEvent) {
  if (!event.params) { return }
  const userId = event.params.userId
  const countRef = shared.database.ref(`/counters/${userId}/unreads`)

  try {
    await countRef.transaction((current) => {
      if (shared.getAction(event) === Action.create) {
        return (current || 0) + 1
      } else if (shared.getAction(event) === Action.delete) {
        return (current || 0) - 1
      }
    })
  } catch (err) {
    console.error(`Error changing unread count: ${err.message}`)
  }
}

export async function onWriteUnreadsCounter(event: shared.DatabaseEvent) {
  if (shared.getAction(event) !== Action.delete) { return }
  if (!event.params) { return }
  const userId = event.params.userId
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