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
  const userId: string = current.val().created_by
  const timestamp = Date.now()
  const channelMembership = shared.channelMemberMap(userId, timestamp, 4, 'owner')
  const updates = {}
  console.log(`Channel created: ${channelId}`)

  updates[`channel-members/${channelId}/${userId}/`] = channelMembership

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
  const photo: any = previous.val().photo
  const updates = {}
  console.log(`Channel deleted: ${channelId}`)

  updates[`channel-messages/${channelId}`] = null
  updates[`channel-members/${channelId}`] = null

  /* Gather list of channel members */
  const memberIds: string[] = await shared.getMemberIds(channelId)
  if (memberIds.length !== 0) {
    memberIds.forEach((memberId) => {
      updates[`member-channels/${memberId}/${channelId}`] = null
      updates[`unreads/${memberId}/${channelId}`] = null
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