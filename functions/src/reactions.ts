/*
 * Message processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

export async function onWriteReaction(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await log(event.params, event.data)
  }
}

async function log(params: any, snapshot: DeltaSnapshot) {
    console.log('snapshot', snapshot)
  /* Gather channel members */
  const channelId = params.channelId
  const messageId = params.messageId
  const reaction = snapshot.val() // userId:true
  const reactionId = params.reactionId // :grinning:
  let userId
  for (const key in reaction) {
      if (reaction.hasOwnProperty(key)) {
        userId = key
    }
  }
  const user: any = (await shared.getUser(userId)).val()
  const username: string = user.username
  const channelName = (await shared.getChannel(channelId)).val().name
  const timestamp = Date.now()
  const timestampReversed = timestamp * -1
  const memberIds: string[] = await shared.getMemberIds(channelId)

  /* Activity */
  try {
    const activity = {
      archived: false,
      channel_id: channelId,
      message_id: messageId,
      created_at: timestamp,
      created_at_desc: timestampReversed,
      modified_at: timestamp,
      text: `#${channelName} @${username}: reacted to message with ${reactionId}.`,
    }
    for (const memberId of memberIds) {
      await shared.database.ref().child(`activity/${memberId}`).push().set(activity)
    }
  } catch (err) {
    console.error('Error creating activity: ', err)
    return
  }
}