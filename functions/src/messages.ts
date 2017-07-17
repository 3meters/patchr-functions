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
  const channelId: string = message.channel_id
  const messageId: string = current.key
  const createdBy: string = message.created_by
  console.log(`Message created: ${messageId}`)

  /* Members that need activity tickle */
  const memberIds: string[] = await shared.getMemberIds(channelId)
  if (memberIds.length > 0) { 
    const updates = {}
    memberIds.forEach((memberId) => {
      updates[`channel-members/${channelId}/${memberId}/activity_at`] = message.created_at
      updates[`channel-members/${channelId}/${memberId}/activity_at_desc`] = message.created_at_desc
      updates[`channel-members/${channelId}/${memberId}/activity_by`] = message.created_by
      updates[`member-channels/${memberId}/${channelId}/activity_at`] = message.created_at
      updates[`member-channels/${memberId}/${channelId}/activity_at_desc`] = message.created_at_desc
      updates[`member-channels/${memberId}/${channelId}/activity_by`] = message.created_by
    })
    await shared.database.ref().update(updates)
  }

  /* Gather list of channel members to notify */
  const notifyIds: string[] = await shared.getMembersToNotify(channelId, [message.created_by])
  if (notifyIds.length === 0) { return }

  console.log('Channel members to notify: ' + notifyIds.length)

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
  } else if (message.text) {
    notificationText = `#${channelName} @${username}: ${message.text}`
  }

  try {
    const installs: any[] = []
    const promises: any[] = []
    const updates = {}
    for (const notifyId of notifyIds) {
      updates[`unreads/${notifyId}/${channelId}/${messageId}`] = true
      updates[`channel-members/${channelId}/${notifyId}/activity_at`] = message.created_at
      updates[`channel-members/${channelId}/${notifyId}/activity_at_desc`] = message.created_at_desc
      updates[`channel-members/${channelId}/${notifyId}/activity_by`] = message.created_by
      updates[`member-channels/${notifyId}/${channelId}/activity_at`] = message.created_at
      updates[`member-channels/${notifyId}/${channelId}/activity_at_desc`] = message.created_at_desc
      updates[`member-channels/${notifyId}/${channelId}/activity_by`] = message.created_by
      promises.push(notify(notifyId, installs))
    }
    await shared.database.ref().update(updates)
    await Promise.all(promises)
    if (installs.length > 0) {
      await notifications.sendMessages(installs, notificationText, data)
    }
  } 
  catch (err) {
    console.error('Error updating unreads and sort priority: ', err)
    return
  }

  async function notify(memberId: string, installs: any[]) {
    const unreads: number = ((await shared.database.ref(`counters/${memberId}/unreads`).once('value')).val() || 0) + 1
    const snaps: shared.DataSnapshot = await shared.database.ref(`installs/${memberId}`).once('value')
    snaps.forEach((install) => {
      if (install.key) {
        installs.push({ id: install.key, userId: memberId, unreads: unreads })         
      }
      return false
    })
  }
}

async function updated(previous: DeltaSnapshot, current: DeltaSnapshot) {
  const messageId: string = current.key
  const previousPhoto: any = shared.getPhotoFromMessage(previous.val())
  const currentPhoto: any = shared.getPhotoFromMessage(current.val())
  console.log(`Message updated: ${messageId}`)

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
  console.log(`Message deleted: ${messageId}`)
  
  /* Clear unread flag for each member */
  const memberIds: string[] = await shared.getMemberIds(channelId)
  if (memberIds.length > 0) { 
    const updates = {}
    memberIds.forEach((memberId) => {
      updates[`unreads/${memberId}/${channelId}/${messageId}`] = null
    })
    await shared.database.ref().update(updates)
  }

  /* Delete image file if needed */
  if (photo) {
    if (photo.source === 'google-storage') {
      console.log(`Deleting image file: ${photo.filename}`)
      await shared.deleteImageFile(photo.filename)
    }
  }
}