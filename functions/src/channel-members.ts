/*
 * Channel member processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type Change = shared.Change

export async function onWriteMember(data: Change, context) {
  if (!context.params) { return }
  if (shared.getAction(data) === Action.create) {
    await created(context.params, data.after)
    await log(Action.create, context.params, data.before, data.after)
  } else if (shared.getAction(data) === Action.delete) {
    await deleted(context.params, data.before)
    await log(Action.delete, context.params, data.before, data.after)
  } else if (shared.getAction(data) === Action.change) {
    await updated(context.params, data.before, data.after)
    await log(Action.change, context.params, data.before, data.after)
  }
}

async function created(params: any, current: DataSnapshot) {
  const membership = current.val()
  console.log(`Member: ${params.userId} added to channel: ${params.channelId}`)
  try {
    await shared.database.ref(`member-channels/${params.userId}/${params.channelId}`).set(membership)
  } catch (err) {
    console.error('Error adding channel member: ', err)
    return
  }
}

async function updated(params: any, previous: DataSnapshot, current: DataSnapshot) {
  const membership = current.val()
  try {
    await shared.database.ref(`member-channels/${params.userId}/${params.channelId}`).set(membership)
  } catch (err) {
    console.error('Error updating channel member: ', err)
    return
  }
}

async function deleted(params: any, previous: DataSnapshot) {
  console.log(`Member: ${params.userId} removed from channel: ${params.channelId}`)
  const updates = {}
  updates[`member-channels/${params.userId}/${params.channelId}`] = null // No trigger
  updates[`unreads/${params.userId}/${params.channelId}`] = null // Delete trigger that updates counter
  try {
    await shared.database.ref().update(updates)
  } catch (err) {
    console.error('Error removing channel member: ', err)
    return
  }
}

async function log(action: any, params: any, previous: DataSnapshot, current: DataSnapshot) {

  /* Gather channel members */
  const channelId = params.channelId
  const userId = params.userId
  const memberIds: string[] = await shared.getMemberIds(channelId)
  if (memberIds.length === 0) { return }
  
  /* Activity */
  try {
    const channelName: string = (await shared.getChannel(channelId)).val().name
    const user: any = (await shared.getUser(userId)).val()
    const username: string = user.username
    const timestamp = Date.now()
    const timestampReversed = timestamp * -1
    const activity = {
      archived: false,
      channel_id: channelId,      
      created_at: timestamp,
      created_at_desc: timestampReversed,
      modified_at: timestamp,
      text: 'empty',
    }

    if (action === Action.create) {
      const membership = current.val()
      activity.text = `#${channelName} @${username}: joined as ${membership.role}.`
    }
    else if (action === Action.change) {
      const membershipCur = current.val()
      const membershipPrev = previous.val()
      if (membershipCur.role !== membershipPrev.role) {
        activity.text = `#${channelName} @${username}: assigned as ${membershipCur.role}.`
      }
    }
    else if (action === Action.delete) {
      activity.text = `#${channelName} @${username}: left the scrapbook.`
    }

    if (activity.text !== 'empty') {
      for (const memberId of memberIds) {
        await shared.database.ref().child(`activity/${memberId}`).push().set(activity)
      }
    }  
  }
  catch (err) {
    console.error('Error creating activity: ', err)
    return
  }  
}