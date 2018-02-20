/*
 * Message processing
 */
import * as shared from './shared'
import * as utils from './utils'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot
let memberIds: string[]
let channelName: string

export async function onWriteChannel(event: shared.DatabaseEvent) {
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
    await log(Action.create, event.params, event.data)
  } else if (shared.getAction(event) === Action.change) {
    await updated(event.data.previous, event.data.current)
    await log(Action.change, event.params, event.data)
  } else if (shared.getAction(event) === Action.delete) {
    await deleted(event.data.previous)
    await log(Action.delete, event.params, event.data)
  }
}

async function created(current: DeltaSnapshot) {
  const channelId: string = current.key
  console.log(`Channel created: ${channelId}`)

  const userId: string = current.val().created_by
  const timestamp = Date.now()
  const slug = shared.slugify(current.val().title)
  const code = current.val().code
  const membership = shared.channelMemberMap(userId, timestamp, 'owner', code)
  const updates = {}
  updates[`channels/${channelId}/name`] = slug
  updates[`channel-members/${channelId}/${userId}/`] = membership

  /* Submit updates */
  await shared.database.ref().update(updates)
}

async function updated(previous: DeltaSnapshot, current: DeltaSnapshot) {
  const channelId: string = current.key
  const previousPhoto: any = previous.val().photo
  const currentPhoto: any = current.val().photo

  if (current.child('title').changed()) {
    const slug: string = shared.slugify(current.val().title) // converts all intl chars to url legal chars
    const updates = {}
    updates[`channels/${channelId}/name`] = slug.toLowerCase()
    await shared.database.ref().update(updates)
  }

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
  channelName = previous.val().name
  console.log(`Channel deleted: ${channelId}`, previous.val().name)

  /* Gather list of channel members */
  memberIds = await shared.getMemberIds(channelId)
  for (const memberId of memberIds) {
    updates[`member-channels/${memberId}/${channelId}`] = null
    updates[`unreads/${memberId}/${channelId}`] = null
  }
  updates[`channel-messages/${channelId}`] = null
  updates[`channel-members/${channelId}`] = null

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

async function log(action: any, params: any, snapshot: DeltaSnapshot) {

  /* Gather channel members */
  const channelId = params.channelId
  let userId = ''
  if (snapshot.exists()) {
    userId = snapshot.val().owned_by
  } else if (snapshot.previous.exists()) {
    userId = snapshot.previous.val().owned_by
  }

  if (!memberIds) {
    memberIds = await shared.getMemberIds(channelId)
    if (memberIds.length === 0) {
      return
    }
  }

  /* Activity */
  try {
    if (!channelName) {
      channelName = (await shared.getChannel(channelId)).val().name
    }
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
      activity.text = `#${channelName} @${username}: created scrapbook.`
    } else if (action === Action.change) {
      const previousPhoto: any = snapshot.previous.val().photo
      const currentPhoto: any = snapshot.val().photo
      if (previousPhoto) {
        if (!currentPhoto || previousPhoto.filename !== currentPhoto.filename) {
          activity.text = `#${channelName} @${username}: changed cover photo.`
        }
      } else if (currentPhoto) {
        activity.text = `#${channelName} @${username}: added cover photo.`
      }
    } else if (action === Action.delete) {
      memberIds = [snapshot.previous.val().owned_by]
      activity.text = `#${channelName} @${username}: deleted scrapbook.`
    }
    if (activity.text !== 'empty') {
      for (const memberId of memberIds) {
        await shared.database.ref().child(`activity/${memberId}`).push().set(activity)
      }
    }
  } catch (err) {
    console.error('Error creating activity: ', err)
    return
  }
}