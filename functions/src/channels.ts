/*
 * Message processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type Change = shared.Change
let memberIds: string[]
let channelName: string

export async function onWriteChannel(data: Change, context) {
  if (shared.getAction(data) === Action.create) {
    await created(data.after)
    await log(Action.create, context.params, data)
  } else if (shared.getAction(data) === Action.change) {
    await updated(data.before, data.after)
    await log(Action.change, context.params, data)
  } else if (shared.getAction(data) === Action.delete) {
    await deleted(data.before)
    await log(Action.delete, context.params, data)
  }
}

async function created(current: DataSnapshot) {
  const channelId: string | null = current.key
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

async function updated(before: DataSnapshot, current: DataSnapshot) {
  const channelId: string | null = current.key
  const photoBefore: any = before.val().photo
  const photoAfter: any = current.val().photo

  if (current.child('title') !== before.child('title')) {
    const slug: string = shared.slugify(current.val().title) // converts all intl chars to url legal chars
    const updates = {}
    updates[`channels/${channelId}/name`] = slug.toLowerCase()
    await shared.database.ref().update(updates)
  }

  if (photoBefore) {
    if (!photoAfter || photoBefore.filename !== photoAfter.filename) {
      if (photoBefore.source === 'google-storage') {
        console.log(`Deleting image file: ${photoBefore.filename}`)
        await shared.deleteImageFile(photoBefore.filename)
      }
    }
  }
}

async function deleted(before: DataSnapshot) {
  const channelId: string | null = before.key
  const photo: any = before.val().photo
  const updates = {}
  channelName = before.val().name
  console.log(`Channel deleted: ${channelId}`, before.val().name)

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

async function log(action: any, params: any, snapshot: Change) {

  /* Gather channel members */
  const channelId = params.channelId
  let userId = ''
  if (snapshot.after.exists()) {
    userId = snapshot.after.val().owned_by
  } else if (snapshot.before.exists()) {
    userId = snapshot.before.val().owned_by
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
      const previousPhoto: any = snapshot.before.val().photo
      const currentPhoto: any = snapshot.after.val().photo
      if (previousPhoto) {
        if (!currentPhoto || previousPhoto.filename !== currentPhoto.filename) {
          activity.text = `#${channelName} @${username}: changed cover photo.`
        }
      } else if (currentPhoto) {
        activity.text = `#${channelName} @${username}: added cover photo.`
      }
    } else if (action === Action.delete) {
      memberIds = [snapshot.before.val().owned_by]
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