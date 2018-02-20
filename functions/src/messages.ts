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
  const messageRef = current.adminRef
  const messageId: string = current.key
  const channelId: string = message.channel_id
  const createdBy: string = message.created_by
  
  if (message.moving) {
    const updates = { moving: null }
    await messageRef.update(updates)
    console.log(`Message moved: ${messageId} to: ${channelId} by: ${createdBy}`)
    return 
  }

  console.log(`Message created: ${messageId} for: ${channelId} by: ${createdBy}`)
  
  /* Gather channel members except muted or author */
  const notifyIds: string[] = await shared.getMemberIdsToNotify(channelId, [createdBy])
  if (notifyIds.length === 0) { return }

  const members: any[] = []
  for (const notifyId of notifyIds) {
    const user: any = (await shared.getUser(notifyId)).val()
    const language: string = user.profile.language ? user.profile.language : 'en'
    members.push({ id: notifyId, language: language })
  }
  console.log('Members to notify count: ', members.length)

  /* Flag unread, tickle activity */
  try {
    const updates = {}
    const timestamp = Date.now()
    const timestampReversed = timestamp * -1
    for (const userId of notifyIds) {
      updates[`unreads/${userId}/${channelId}/${messageId}/message`] = true
      updates[`member-channels/${userId}/${channelId}/activity_at`] = timestamp
      updates[`member-channels/${userId}/${channelId}/activity_at_desc`] = timestampReversed
      updates[`member-channels/${userId}/${channelId}/activity_by`] = createdBy
      updates[`channel-members/${channelId}/${userId}/activity_at`] = timestamp
      updates[`channel-members/${channelId}/${userId}/activity_at_desc`] = timestampReversed
      updates[`channel-members/${channelId}/${userId}/activity_by`] = createdBy
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

    const username: string = (await shared.getUser(createdBy)).val().username
    const channelName: string = (await shared.getChannel(channelId)).val().name
    const data = {
      user_id: createdBy,
      channel_id: channelId,
      message_id: messageId,
    }
    const photo: any = shared.getPhotoFromMessage(message)    

    /* English */
    if (installs.en.length > 0 ) {
      let notificationText: string = ''
      if (photo) {
        notificationText = `#${channelName}: @${username} posted a photo`
        if (message.text) {
          notificationText += ` and commented: ${message.text}`
        }
      } 
      else if (message.text) {
        notificationText = `#${channelName} @${username}: ${message.text}`
      }
      await notifications.sendMessages(installs.en, notificationText, data)
    }

    /* Russian */
    if (installs.ru.length > 0 ) {
      let notificationText: string = ''
      if (photo) {
        notificationText = `#${channelName}: @${username} опубликовал(а) фото`
        if (message.text) {
          notificationText += ` и прокомментировал(а): ${message.text}`
        }
      } 
      else if (message.text) {
        notificationText = `#${channelName} @${username}: ${message.text}`
      }
      await notifications.sendMessages(installs.ru, notificationText, data)
    }
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