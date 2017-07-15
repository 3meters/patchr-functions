/*
 * User processing
 */
import * as shared from './shared'
import * as utils from './utils'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type DeltaSnapshot = shared.DeltaSnapshot

export async function onWriteProfile(event: shared.DatabaseEvent) {
  if (!event.params) { return }
  if (shared.getAction(event) === Action.delete) {
    await deletedProfile(event.params.userId, event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await changedProfile(event.params.userId, event.data.previous, event.data.current)
  }
}

export async function onWriteUsername(event: shared.DatabaseEvent) {
  if (!event.params) { return }
  if (shared.getAction(event) === Action.create) {
    await createdUsername(event.params.userId, event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deletedUsername(event.params.userId, event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await changedUsername(event.params.userId, event.data.previous, event.data.current)
  }
}

export async function createUser(task: any) {
  const req = task.request
  const user = {
    created_at: admin.database.ServerValue.TIMESTAMP,
    created_by: task.created_by,
    modified_at: admin.database.ServerValue.TIMESTAMP,
    username: req.username,
  }
  const userId = req.user_id
  const timestamp = Date.now()
  const updates = {}
  /* Add default general channel */
  const generalId = `ch-${utils.generateRandomId()}`
  const general = {
    archived: false,
    created_at: timestamp,
    created_by: userId,
    general: true,
    name: 'general',
    owned_by: userId,
    purpose: 'This channel is for messaging and announcements to the whole group. All group members are in this channel.',
  }
  updates[`channels/${generalId}`] = general

  /* Add default chatter channel */
  const chatterId = `ch-${utils.generateRandomId()}`
  const chatter = {
    archived: false,
    created_at: timestamp,
    created_by: userId,
    general: true,
    name: 'chatter',
    owned_by: userId,
    purpose: 'The perfect place for crazy talk that you\'d prefer to keep off the other channels.',
  }
  updates[`channels/${chatterId}`] = chatter

  console.log(`Creating user: ${req.user_id}`)

  try {
    await shared.database.ref(`users/${req.user_id}`).set(user) // Validation will catch duplicate username
    await shared.database.ref().update(updates)
    if (task.adminRef) {
      await task.adminRef.child('response').set({ result: 'ok' })
    }
  } catch (err) {
    console.error(`Error creating user: ${err}`)
    if (task.adminRef) {
      await task.adminRef.child('response').set({ error: `Error creating user: ${err.message}` })
    }
  }
}

/* Profile */

async function changedProfile(userId: string, previous: DeltaSnapshot, current: DeltaSnapshot) {
  console.log(`Profile changed: ${userId}`)
  /* Delete previous image file if needed */
  if (current.child('profile/photo/filename').changed()) {
    const previousPhoto = previous.val().photo
    if (previousPhoto && previousPhoto.source === 'google-storage') {
      console.log(`Deleting image file: ${previousPhoto.filename}`)
      await shared.deleteImageFile(previousPhoto.filename)
    }
  }
}

async function deletedProfile(userId: string, previous: DeltaSnapshot) {
  console.log(`Profile deleted: ${userId}`)
  /* Delete image file if needed */
  const photo: any = previous.val().photo
  if (photo && photo.source === 'google-storage') {
    console.log(`Deleting image file: ${photo.filename}`)
    await shared.deleteImageFile(photo.filename)
  }
}

/* Username */

async function createdUsername(userId: string, current: DeltaSnapshot) {
  const updates = {}
  console.log(`Claiming username: ${current.val()}`)
  updates[`usernames/${current.val()}`] = null
  await shared.database.ref().update(updates)
}

async function changedUsername(userId: string, previous: DeltaSnapshot, current: DeltaSnapshot) {
  /* Release old username and claim new one */
  const previousUsername: string = previous.val()
  const currentUsername: string = current.val()
  console.log(`User ${userId} changed username: ${previousUsername} to: ${currentUsername}`)
  const update = {}
  update[`usernames/${previousUsername}`] = null
  update[`usernames/${currentUsername}`] = userId
  await shared.database.ref().update(update)
}

async function deletedUsername(userId: string, previous: DeltaSnapshot) {
  const updates = {}
  console.log(`Releasing username: ${previous.val()}`)
  updates[`usernames/${previous.val()}`] = null
  await shared.database.ref().update(updates)
}