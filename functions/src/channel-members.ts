/*
 * Group member processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

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
  const membership = current.val()
  console.log(`Member: ${params.userId} added to channel: ${params.channelId} in group: ${params.groupId}`)
  try {
    await shared.database.ref(`member-channels/${params.userId}/${params.groupId}/${params.channelId}`).set(membership)
  } catch (err) {
    console.error('Error adding channel member: ', err)
    return
  }
}

async function changed(params: any, previous: DeltaSnapshot, current: DeltaSnapshot) {
  const membership = current.val()
  console.log(`Channel member updated: ${params.userId}`)
  try {
    await shared.database.ref(`member-channels/${params.userId}/${params.groupId}/${params.channelId}`).set(membership)
  } catch (err) {
    console.error('Error updating channel member: ', err)
    return
  }
}

async function deleted(params: any, previous: DeltaSnapshot) {
  console.log(`Member: ${params.userId} removed from channel: ${params.channelId} in group: ${params.groupId}`)
  const updates = {}
  updates[`member-channels/${params.userId}/${params.groupId}/${params.channelId}`] = null // No trigger
  updates[`unreads/${params.userId}/${params.groupId}/${params.channelId}`] = null // Delete trigger that updates counter
  try {
    await shared.database.ref().update(updates)
  } catch (err) {
    console.error('Error removing channel member: ', err)
    return
  }
}