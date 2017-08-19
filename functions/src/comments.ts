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
  const createdBy: string = current.val().created_by
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

  /* Mark message as unread for message creator */
  const messageCreatedBy: string = (await shared.getMessage(channelId, messageId)).val().created_by
  if (messageCreatedBy === createdBy) { return } // Don't notify if self commenting.
  const updates = {}
  updates[`unreads/${messageCreatedBy}/${channelId}/${messageId}`] = commentId
  await shared.database.ref().update(updates)
}