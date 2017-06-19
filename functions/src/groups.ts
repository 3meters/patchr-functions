/*
 * Group processing
 */
import * as _ from 'lodash'
import * as shared from './shared'
import * as utils from './utils'
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot
const Action = shared.Action
const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1]

/* Two extra invokes: task updated with response, task deleted by client. */

export async function onWriteGroup(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await changed(event.data.previous, event.data.current)
  }
}

async function created(current: DeltaSnapshot) {
  const groupId: string = current.key
  const userId: string = current.val().created_by
  const timestamp = Date.now()
  console.log(`Group created: ${groupId}`)

  /* Add creator as group owner */
  const user: admin.auth.UserRecord = await shared.auth.getUser(userId)
  const groupMembership = shared.groupMemberMap(userId, timestamp, 4, 'owner', user.email)
  const updates = {}
  updates[`group-members/${groupId}/${userId}/`] = groupMembership

  /* Add default general channel */
  const generalId = `ch-${utils.generateRandomId()}`
  const general = {
    archived: false,
    created_at: timestamp,
    created_by: userId,
    general: true,
    group_id: groupId,
    name: 'general',
    owned_by: userId,
    purpose: 'This channel is for messaging and announcements to the whole group. All group members are in this channel.',
    type: 'channel',
    visibility: 'open',
  }
  updates[`group-channels/${groupId}/${generalId}`] = general

  /* Add default chatter channel */
  const chatterId = `ch-${utils.generateRandomId()}`
  const chatter = {
    archived: false,
    created_at: timestamp,
    created_by: userId,
    general: true,
    group_id: groupId,
    name: 'chatter',
    owned_by: userId,
    purpose: 'The perfect place for crazy talk that you\'d prefer to keep off the other channels.',
    type: 'channel',
    visibility: 'open',
  }
  updates[`group-channels/${groupId}/${chatterId}`] = chatter
  updates[`groups/${groupId}/default_channels`] = [generalId, chatterId]

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
  const groupId: string = previous.key
  const photo: any = previous.val().photo
  const updates = {}
  console.log(`Group deleted: ${groupId}`)

  updates[`group-channels/${groupId}`] = null // No trigger
  updates[`invites/${groupId}`] = null // No trigger
  updates[`groups/${groupId}`] = null // No trigger
  updates[`group-members/${groupId}`] = null // No trigger
  updates[`channel-names/${groupId}`] = null // No trigger

  /* Gather list of group members */
  const memberIds: string[] = await shared.getMemberIds(groupId, null)
  if (memberIds.length !== 0) {
    memberIds.forEach((memberId) => {
      updates[`member-groups/${memberId}/${groupId}`] = null // No trigger
      updates[`unreads/${memberId}/${groupId}`] = null // No trigger
      updates[`member-channels/${memberId}/${groupId}`] = null // No trigger
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