/*
 * Message processing
 */
import * as notifications from './notifications'
import * as shared from './shared'
type DataSnapshot = shared.DataSnapshot

export async function onWriteComment(data: DataSnapshot, context) {
  await created(data)
}

async function created(current: DataSnapshot) {
  const comment = current.val()
  const commentId: string | null = current.key
  const channelId: string = comment.channel_id
  const messageId: string = comment.message_id
  const commentCreatedBy: string = comment.created_by
  const commentUser: any = (await shared.getUser(commentCreatedBy)).val()
  const commentUsername: string = commentUser.username

  console.log(`Comment created: ${commentId} for: ${messageId} channel: ${channelId} by: ${commentCreatedBy}`)

  /* Send comment notifications to all channel members except comment creator */

  /* Gather channel members except muted or author */
  const createdBy: string = (await shared.getMessageCreatedBy(channelId, messageId))
  const notifyIds: string[] = await shared.getMemberIdsToNotify(channelId, [createdBy])
  if (notifyIds.length === 0) { return }

  const members: any[] = []
  for (const notifyId of notifyIds) {
    const user: any = (await shared.getUser(notifyId)).val()
    const language: string = user.profile.language ? user.profile.language : 'en'
    members.push({ id: notifyId, language: language })
  }

  /* Flag unread and tickle activity for channel members */
  try {
    const updates = {}
    const timestamp = Date.now()
    const timestampReversed = timestamp * -1
    for (const userId of notifyIds) {
      updates[`unreads/${userId}/${channelId}/${messageId}/comments/${commentId}`] = true
      updates[`channel-members/${channelId}/${userId}/activity_at`] = timestamp
      updates[`channel-members/${channelId}/${userId}/activity_at_desc`] = timestampReversed
      updates[`channel-members/${channelId}/${userId}/activity_by`] = commentCreatedBy
    }
    await shared.database.ref().update(updates)
  } 
  catch (err) {
    console.error('Error updating unreads and sort priority: ', err)
    return
  }

  /* Notify */
  try {
    /* Gather installs */
    const installs = { en: [], ru: []}
    const promises: any[] = []
    for (const member of members) {
      promises.push(notifications.gatherInstalls(member.id, installs[member.language]))
    }
    await Promise.all(promises)

    if (installs.en.length === 0 && installs.ru.length === 0) { return }
    console.log(`Installs to notify: en = ${installs.en.length}, ru = ${installs.ru.length}`)

    const channelName: string = (await shared.getChannel(channelId)).val().name
    const data = {
      user_id: commentCreatedBy,
      channel_id: channelId,
      message_id: messageId,
    }

    /* English */
    if (installs.en.length > 0 ) {
      const notificationText: string = `#${channelName} @${commentUsername}: commented on a post: ${comment.text}`
      await notifications.sendMessages(installs.en, notificationText, data)
    }

    /* Russian */
    if (installs.ru.length > 0 ) {
      const notificationText: string = `#${channelName} @${commentUsername}: прокомментировал(а) публикацию: ${comment.text}`
      await notifications.sendMessages(installs.ru, notificationText, data)
    }
  } 
  catch (err) {
    console.error('Error processing new comment notifications: ', err)
    return
  }
}