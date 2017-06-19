/*
 * Message processing
 */
import * as notifications from './notifications'
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1]

export async function onWriteMessage(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await changed(event.data.previous, event.data.current)
  }
}

async function created(current: shared.DeltaSnapshot) {

  const message = current.val()
  const channelId: string = message.channel_id
  const groupId: string = message.group_id
  const messageId: string = current.key
  const createdBy: string = message.created_by
  console.log(`Message created: ${messageId}`)

  /* Gather list of channel members */
  const memberIds: string[] = await shared.getMembersToNotify(groupId, channelId, [message.created_by])
  if (memberIds.length === 0) { return }

  console.log('Channel members to notify: ' + memberIds.length)

  const username: string = (await shared.getUser(createdBy)).val().username
  const channelName: string = (await shared.getChannel(groupId, channelId)).val().name
  const data = {
    user_id: createdBy,
    group_id: groupId,
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
    for (const memberId of memberIds) {
      promises.push(notify(memberId, installs))
    }
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
    await shared.database.ref(`unreads/${memberId}/${groupId}/${channelId}/${messageId}`).set(true)
    const membership: shared.DataSnapshot = await shared.database.ref(`member-channels/${memberId}/${groupId}/${channelId}`).once('value')
    /* Bump sort priority */
    if (membership.val().priority !== 0) {
      const timestamp = membership.val().joined_at // not a real timestamp, shortened to 10 digits
      await membership.ref.update({
        priority: 0,
        index_priority_joined_at: parseInt('' + priorities[0] + timestamp),
        index_priority_joined_at_desc: parseInt('' + priorities_reversed[0] + timestamp) * -1,
      })
    }
    /* Find installs to notify */
    const snaps: shared.DataSnapshot = await shared.database.ref(`installs/${memberId}`).once('value')
    snaps.forEach((install) => {
      if (install.key) {
        installs.push({ id: install.key, userId: memberId, unreads: unreads })         
      }
      return false
    })
  }
}

async function changed(previous: DeltaSnapshot, current: DeltaSnapshot) {
  const messageId: string = current.key
  const previousPhoto: any = shared.getPhotoFromMessage(previous.val())
  const currentPhoto: any = shared.getPhotoFromMessage(current.val())
  console.log(`Message changed: ${messageId}`)

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
  const groupId: string = previous.val().group_id
  const messageId: string = previous.key
  const photo: any = shared.getPhotoFromMessage(previous.val())
  console.log(`Message deleted: ${messageId}`)
  
  /* Clear unread flag for each member */
  const memberIds: string[] = await shared.getMemberIds(groupId, channelId)
  if (memberIds.length > 0) { 
    const updates = {}
    memberIds.forEach((memberId) => {
      updates[`unreads/${memberId}/${groupId}/${channelId}/${messageId}`] = null
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