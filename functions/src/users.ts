/*
 * User processing
 */
import * as shared from './shared'
const Action = shared.Action
type DataSnapshot = shared.DataSnapshot
type Change = shared.Change

export async function onUpdateProfile(data: Change, context) {
  if (!context.params) { return }
  await updatedProfile(context.params.userId, data.before, data.after)
}

export async function onDeleteProfile(data: DataSnapshot, context) {
  if (!context.params) { return }
  await deletedProfile(context.params.userId, data)
}

export async function onWriteUsername(data: Change, context) {
  if (!context.params) { return }
  if (shared.getAction(data) === Action.create) {
    await createdUsername(context.params.userId, data.after)
  } else if (shared.getAction(data) === Action.delete) {
    await deletedUsername(context.params.userId, data.before)
  } else if (shared.getAction(data) === Action.change) {
    await updatedUsername(context.params.userId, data.before, data.after)
  }
}

/* Profile */

async function updatedProfile(userId: string, before: DataSnapshot, after: DataSnapshot) {
  console.log(`Profile updated: ${userId}`)
  /* Delete previous image file if needed */

  const photoBefore: any = before.val().photo
  const photoAfter: any = after.val().photo
  if (photoBefore) {
    if (!photoAfter || photoAfter.filename !== photoBefore.filename) {
      if (photoBefore.source === 'google-storage') {
        console.log(`Deleting image file: ${photoBefore.filename}`)
        await shared.deleteImageFile(photoBefore.filename)
      }
    }
  }
}

async function deletedProfile(userId: string, before: DataSnapshot) {
  console.log(`Profile deleted: ${userId}`)
  /* Delete image file if needed */
  const photo: any = before.val().photo
  if (photo && photo.source === 'google-storage') {
    console.log(`Deleting image file: ${photo.filename}`)
    await shared.deleteImageFile(photo.filename)
  }
}

/* Username */

async function createdUsername(userId: string, current: DataSnapshot) {
  const updates = {}
  const username = current.val()
  console.log(`Claiming username: ${username}`)
  updates[`usernames/${username}`] = userId
  await shared.database.ref().update(updates)
}

async function updatedUsername(userId: string, previous: DataSnapshot, current: DataSnapshot) {
  /* Release old username and claim new one */
  const previousUsername: string = previous.val()
  const currentUsername: string = current.val()
  console.log(`User ${userId} updated username: ${previousUsername} to: ${currentUsername}`)
  const update = {}
  update[`usernames/${previousUsername}`] = null
  update[`usernames/${currentUsername}`] = userId
  await shared.database.ref().update(update)
}

async function deletedUsername(userId: string, previous: DataSnapshot) {
  const updates = {}
  console.log(`Releasing username: ${previous.val()}`)
  updates[`usernames/${previous.val()}`] = null
  await shared.database.ref().update(updates)
}