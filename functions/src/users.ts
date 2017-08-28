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
    await updatedProfile(event.params.userId, event.data.previous, event.data.current)
  }
}

export async function onWriteUsername(event: shared.DatabaseEvent) {
  if (!event.params) { return }
  if (shared.getAction(event) === Action.create) {
    await createdUsername(event.params.userId, event.data.current)
  } else if (shared.getAction(event) === Action.delete) {
    await deletedUsername(event.params.userId, event.data.previous)
  } else if (shared.getAction(event) === Action.change) {
    await updatedUsername(event.params.userId, event.data.previous, event.data.current)
  }
}

/* Profile */

async function updatedProfile(userId: string, previous: DeltaSnapshot, current: DeltaSnapshot) {
  console.log(`Profile updated: ${userId}`)
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
  const username = current.val()
  console.log(`Claiming username: ${username}`)
  updates[`usernames/${username}`] = userId
  await shared.database.ref().update(updates)
}

async function updatedUsername(userId: string, previous: DeltaSnapshot, current: DeltaSnapshot) {
  /* Release old username and claim new one */
  const previousUsername: string = previous.val()
  const currentUsername: string = current.val()
  console.log(`User ${userId} updated username: ${previousUsername} to: ${currentUsername}`)
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