/*
 * Message processing
 */
import * as notifications from './notifications'
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

export async function onWriteMessage(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await updated(event.data.previous, event.data.current)
  }
}

async function created(current: shared.DeltaSnapshot) {

  const message = current.val()
  const messageRef = current.val().adminRef
  const messageId: string = current.key
  const channelId: string = message.channel_id
  const createdBy: string = message.created_by
  
  if (message.moving) {
    console.log(`Message moved: ${messageId} to: ${channelId} by: ${createdBy}`)
    const updates = { moving: null }
    await messageRef.adminRef.update(updates)
    return 
  }

  console.log(`Message created: ${messageId} for: ${channelId} by: ${createdBy}`)
  
  /* Gather channel members except muted or author */
  const notifyIds: string[] = await shared.getMembersToNotify(channelId, [createdBy])
  if (notifyIds.length === 0) { return }

  /* Flag unread, tickle activity */
  try {
    const updates = {}
    notifyIds.forEach((memberId) => {
      updates[`unreads/${memberId}/${channelId}/${messageId}`] = true
      /* Trigger will mirror these updates to 'member-channels' */
      updates[`channel-members/${channelId}/${memberId}/activity_at`] = message.created_at
      updates[`channel-members/${channelId}/${memberId}/activity_at_desc`] = message.created_at_desc
      updates[`channel-members/${channelId}/${memberId}/activity_by`] = createdBy
    })
    console.log('Channel members to notify: ' + notifyIds.length)
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
    for (const notifyId of notifyIds) {
      promises.push(notifications.gatherInstalls(notifyId, installs))
    }
    await Promise.all(promises)

    if (installs.length === 0) { return }

    const username: string = (await shared.getUser(createdBy)).val().username
    const channelName: string = (await shared.getChannel(channelId)).val().name
    const data = {
      user_id: createdBy,
      channel_id: channelId,
      message_id: messageId,
    }
    let notificationText: string = ''
    if (message.photo) {
      notificationText = `#${channelName} @${username}: @${username} posted a photo`
      if (message.text) {
        notificationText += ` and commented: ${message.text}`
      }
    } 
    else if (message.text) {
      notificationText = `#${channelName} @${username}: ${message.text}`
    }
    await notifications.sendMessages(installs, notificationText, data)
  } 
  catch (err) {
    console.error('Error processing new message notifications: ', err)
    return
  }
}

async function updated(previous: DeltaSnapshot, current: DeltaSnapshot) {
  const messageId: string = current.key
  const channelId: string = current.val().channel_id
  const previousPhoto: any = shared.getPhotoFromMessage(previous.val())
  const currentPhoto: any = shared.getPhotoFromMessage(current.val())

  if (previousPhoto) {
    if (!currentPhoto || previousPhoto.filename !== currentPhoto.filename) {
      if (previousPhoto.source === 'google-storage') {
        console.log(`Deleting image file: ${previousPhoto.filename}`)
        await shared.deleteImageFile(previousPhoto.filename)
      }
    }
  }
}

async function deleted(previous: DeltaSnapshot) {
  const channelId: string =  previous.val().channel_id
  const messageId: string = previous.key
  const photo: any = shared.getPhotoFromMessage(previous.val())
  console.log(`Message deleted: ${messageId} for: ${channelId}`)

  const updates = {}

  /* Clear unread flag for each member */
  const memberIds: string[] = await shared.getMemberIds(channelId)
  if (memberIds.length > 0) { 
    memberIds.forEach((memberId) => {
      updates[`unreads/${memberId}/${channelId}/${messageId}`] = null
    })
  }

  /* Clear comments */
  updates[`message-comments/${channelId}/${messageId}`] = null

  /* Commit updates */
  await shared.database.ref().update(updates)

  /* Delete image file if needed */
  if (photo && !previous.val().moving) {
    if (photo.source === 'google-storage') {
      console.log(`Deleting image file: ${photo.filename}`)
      await shared.deleteImageFile(photo.filename)
    }
  }
}

export async function onWriteCommentsCounter(event: shared.DatabaseEvent) {
  if (shared.getAction(event) !== Action.delete) { return }
  if (!event.params) { return }
  const channelId = event.params.channelId
  const messageId = event.params.messageId
  const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`)
  const commentsRef = shared.database.ref(`/message-comments/${channelId}/${messageId}`)

  try {
    const comments: DataSnapshot = await commentsRef.once('value')
    const count = comments.numChildren()
    await countRef.set(count)
    console.log(`Recounting comments for ${messageId} total ${count}`)
  } catch (err) {
    console.error(`Error counting comments: ${err.message}`)
  }
}