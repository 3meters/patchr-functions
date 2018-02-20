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

  /* Flag unread and tickle activity for message creator */
  const notifyId: string = (await shared.getMessageCreatedBy(channelId, messageId))
  if (notifyId === comment.created_by) { return } // Don't do anything if self commenting.

  try {
    const updates = {}
    const timestamp = Date.now()
    const timestampReversed = timestamp * -1
    updates[`unreads/${notifyId}/${channelId}/${messageId}/comments/${commentId}`] = true
    updates[`channel-members/${channelId}/${notifyId}/activity_at`] = timestamp
    updates[`channel-members/${channelId}/${notifyId}/activity_at_desc`] = timestampReversed
    updates[`channel-members/${channelId}/${notifyId}/activity_by`] = comment.created_by
    await shared.database.ref().update(updates)
  } catch (err) {
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

    const channelName: string = (await shared.getChannel(channelId)).val().name
    const user: any = (await shared.getUser(notifyId)).val()
    const username: string = user.username
    const language: string = user.profile.language ? user.profile.language : 'en'
    const data = {
      user_id: comment.created_by,
      channel_id: channelId,
      message_id: messageId,
    }
    if (language === 'en') {
      const notificationText: string = `#${channelName} @${username}: commented on a post: ${comment.text}`
      await notifications.sendMessages(installs, notificationText, data)
    } else if (language === 'ru') {
      const notificationText: string = `#${channelName} @${username}: прокомментировал(а) публикацию: ${comment.text}`
      await notifications.sendMessages(installs, notificationText, data)
    }
  } catch (err) {
    console.error('Error processing new comment notifications: ', err)
    return
  }
}