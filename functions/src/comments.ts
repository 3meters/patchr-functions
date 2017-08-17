/*
 * Message processing
 */
import * as notifications from './notifications'
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

export async function onWriteComment(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
  }
}

async function created(current: shared.DeltaSnapshot) {
  const commentId: string = current.key
  const channelId: string = current.val().channel_id
  const messageId: string = current.val().message_id
  console.log(`Comment created: ${commentId} for: ${messageId} channel: ${channelId}`)

  /* Increment comment counter on message */
  try {
    const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`)
    await countRef.transaction((cur) => {
      return (cur || 0) + 1
    })
  } catch (err) {
    console.error(`Error changing comment count: ${err.message}`)
  }
}