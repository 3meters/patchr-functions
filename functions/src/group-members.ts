/*
 * Group member processing
 */
import * as shared from './shared'
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot
const Action = shared.Action

export async function onWriteMember(event: shared.DatabaseEvent) {
  if (!event.params) { return }
  if (shared.getAction(event) === Action.create) {
    await created(event.params, event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.params, event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await changed(event.params, event.data.previous, event.data.current)
  }
}

async function created(params: any, current: shared.DeltaSnapshot) {
  /* Validation means membership passed all requirements (group exists, invite or by owner)
    Add to member-groups
    Add to group default channels if not guest */
  const membership = current.val()
  const timestamp = Date.now()
  console.log(`User: ${params.userId} added to group: ${params.groupId}`)

  try {
    const updates = {}
    updates[`member-groups/${params.userId}/${params.groupId}`] = membership
    if (membership.role !== 'guest') {
      const defaults: string[] = (await shared.database.ref(`groups/${params.groupId}/default_channels`).once('value')).val()
      const channelMembership = shared.channelMemberMap(params.userId, timestamp, 4, 'member')
      defaults.forEach((channelId) => {
        updates[`group-channel-members/${params.groupId}/${channelId}/${params.userId}/`] = channelMembership
      })
    }
    if (membership.invite_id) {
      const path = `invites/${params.groupId}/${membership.invited_by}/${membership.invite_id}`
      updates[`${path}/accepted_at`] = timestamp
      updates[`${path}/accepted_by`] = params.userId
      updates[`${path}/status`] = 'accepted' // Can still be used again
    }
    /* Commit all the required updates */
    await shared.database.ref().update(updates)
  } 
  catch (err) {
    console.error('Error adding group member: ', err)
    return
  }
}

async function changed(params: any, previous: DeltaSnapshot, current: DeltaSnapshot) {
  const membership = current.val()
  console.log(`Group member updated: ${params.userId}`)
  try {
    await shared.database.ref(`member-groups/${params.userId}/${params.groupId}`).set(membership)
  } catch (err) {
    console.error('Error updating group member: ', err)
    return
  }
}

async function deleted(params: any, previous: DeltaSnapshot) {
  console.log(`Member: ${params.userId} removed from group: ${params.groupId}`)
  const updates = {}
  updates[`member-groups/${params.userId}/${params.groupId}`] = null // No trigger
  updates[`member-channels/${params.userId}/${params.groupId}`] = null // No trigger 
  updates[`invites/${params.groupId}/${params.userId}`] = null // No trigger
  updates[`unreads/${params.userId}/${params.groupId}`] = null // No trigger

  try {
    /* Remove the user from all their channel memberships */
    const channelIds: string[] = await shared.getMemberChannelIds(params.userId, params.groupId)
    if (channelIds.length > 0) {
      channelIds.forEach((channelId) => {
        /* Has delete trigger that also removes from member-channels 
          and unreads (has delete trigger) */
        updates[`group-channel-members/${params.groupId}/${channelId}/${params.userId}`] = null
      })
    }
    await shared.database.ref().update(updates)
  } catch (err) {
    console.error('Error removing group member: ', err)
    return
  }
}