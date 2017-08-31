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
  const comment = current.val()
  const commentId: string = current.key
  const channelId: string = comment.channel_id
  const messageId: string = comment.message_id
  console.log(`Comment created: ${commentId} for: ${messageId} channel: ${channelId} by: ${comment.created_by}`)

  /* Increment comment counter on message */
  try {
    const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`)
    await countRef.transaction((cur) => {
      return (cur || 0) + 1
    })
  } 
  catch (err) {
    console.error(`Error changing comment count: ${err.message}`)
  }

  /* Flag unread and tickle activity for message creator */
  const notifyId: string = (await shared.getMessage(channelId, messageId)).val().created_by
  if (notifyId === comment.created_by) { return } // Don't notify if self commenting.

  try {
    const updates = {}
    updates[`unreads/${notifyId}/${channelId}/${messageId}`] = commentId
    updates[`channel-members/${channelId}/${notifyId}/activity_at`] = comment.created_at
    updates[`channel-members/${channelId}/${notifyId}/activity_at_desc`] = comment.created_at_desc
    updates[`channel-members/${channelId}/${notifyId}/activity_by`] = comment.created_by    
    await shared.database.ref().update(updates)
  }
  catch (err) {
    console.error('Error updating unreads and sort priority: ', err)
    return
  }

  /* Notify */
  try {
    /* Gather installs */
    const installs: any[] = []
    const promises: any[] = []
    promises.push(notifications.gatherInstalls(notifyId, installs))
    await Promise.all(promises)

    if (installs.length === 0) { return }

    const username: string = (await shared.getUser(comment.created_by)).val().username
    const channelName: string = (await shared.getChannel(channelId)).val().name
    const data = {
      user_id: comment.created_by,
      channel_id: channelId,
      message_id: messageId,
    }
    const notificationText: string = `#${channelName} @${username}: commented on a post: ${comment.text}`
    await notifications.sendMessages(installs, notificationText, data)
  } 
  catch (err) {
    console.error('Error processing new comment notifications: ', err)
    return
  }
}