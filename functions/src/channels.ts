/*
 * Message processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

export async function onWriteChannel(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await changed(event.data.previous, event.data.current)
  }
}

async function created(current: DeltaSnapshot) {
  const channelId: string = current.key
  const groupId: string = current.val().group_id
  const userId: string = current.val().created_by
  const timestamp = Date.now()
  const channelMembership = shared.channelMemberMap(userId, timestamp, 4, 'owner')
  const updates = {}
  console.log(`Channel created: ${channelId} for group: ${groupId}`)

  updates[`channel-names/${groupId}/${current.val().name}`] = channelId
  updates[`group-channel-members/${groupId}/${channelId}/${userId}/`] = channelMembership

  /* Submit updates */
  await shared.database.ref().update(updates)
}

async function changed(previous: DeltaSnapshot, current: DeltaSnapshot) {
  const channelId: string = current.key
  const previousPhoto: any = previous.val().photo
  const currentPhoto: any = current.val().photo
  console.log(`Channel changed: ${channelId}`)

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
  const channelId: string = previous.key
  const groupId: string = previous.val().group_id
  const photo: any = previous.val().photo
  const updates = {}
  console.log(`Channel deleted: ${channelId} from group: ${groupId}`)

  updates[`group-messages/${groupId}/${channelId}`] = null
  updates[`channel-names/${groupId}/${previous.val().name}`] = null
  updates[`group-channel-members/${groupId}/${channelId}`] = null

  /* Remove from group defaults if needed */
  const defaults: string[] = (await shared.database.ref(`groups/${groupId}/default_channels`).once('value')).val()
  if (defaults) {
    const newDefaults: string[] = defaults.filter((defaultChannelId) => {
      return (defaultChannelId !== channelId)
    })
    if (defaults.length !== newDefaults.length) {
      updates[`groups/${groupId}/default_channels`] = newDefaults
    }
  }

  /* Gather list of channel members */
  const memberIds: string[] = await shared.getMemberIds(groupId, channelId)
  if (memberIds.length !== 0) {
    memberIds.forEach((memberId) => {
      updates[`member-channels/${memberId}/${groupId}/${channelId}`] = null
      updates[`unreads/${memberId}/${groupId}/${channelId}`] = null
    })
  }

  /* Submit updates */
  await shared.database.ref().update(updates)

  /* Delete image file if needed */
  if (photo) {
    if (photo.source === 'google-storage') {
      console.log(`Deleting image file: ${photo.filename}`)
      await shared.deleteImageFile(photo.filename)
    }
  }
}