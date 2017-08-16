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
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.data.previous)
  }
}

async function created(current: shared.DeltaSnapshot) {

  const comment = current.val()
  const commentId: string = current.key
  const channelId: string = comment.channel_id
  const messageId: string = comment.message_id
  const createdBy: string = comment.created_by
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

  /* Notify message creator */
  const messageCreatedBy: string = (await shared.getMessage(channelId, messageId)).val().created_by
  if (messageCreatedBy === createdBy) { return } // Don't notify if self commenting.

  const notifyIds = [messageCreatedBy]
  const username: string = (await shared.getUser(createdBy)).val().username
  const channelName: string = (await shared.getChannel(channelId)).val().name
  const data = {
    user_id: createdBy,
    channel_id: channelId,
    message_id: messageId,
    comment_id: commentId,
  }

  const notificationText = `#${channelName} @${username}: commented on your message: ${comment.text}`

  try {
    const installs: any[] = []
    const promises: any[] = []
    const updates = {}
    for (const notifyId of notifyIds) {
      promises.push(notify(notifyId, installs))
    }
    await Promise.all(promises)
    if (installs.length > 0) {
      await notifications.sendMessages(installs, notificationText, data)
    }
  } catch (err) {
    console.error('Error sending notifications: ', err)
    return
  }

  async function notify(memberId: string, installs: any[]) {
    const snaps: shared.DataSnapshot = await shared.database.ref(`installs/${memberId}`).once('value')
    snaps.forEach((install) => {
      if (install.key) {
        installs.push({ id: install.key, userId: memberId })
      }
      return false
    })
  }
}

async function deleted(previous: DeltaSnapshot) {
  const channelId: string =  previous.val().channel_id
  const messageId: string = previous.val().message_id
  const commentId: string = previous.key
  console.log(`Comment deleted: ${commentId} for: ${messageId}`)

  try {
    const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`)
    await countRef.transaction((current) => {
      return (current || 0) - 1
    })
  } catch (err) {
    console.error(`Error changing comment count: ${err.message}`)
  }
}