/*
 * Common database functions
 */
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'

admin.initializeApp(functions.config().firebase)

export type Database = admin.database.Database
export type DataSnapshot = admin.database.DataSnapshot
export type DeltaSnapshot = functions.database.DeltaSnapshot
export type UserRecord = admin.auth.UserRecord
export type DatabaseEvent = functions.Event < DeltaSnapshot >
export type AuthEvent = functions.Event < UserRecord >

export const messaging: admin.messaging.Messaging = admin.messaging()
export const database: admin.database.Database = admin.database()
export const auth: admin.auth.Auth = admin.auth()

// tslint:disable-next-line:no-var-requires
const gcs = require('@google-cloud/storage')()
const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1]

export async function getMemberIds(channelId: string | null) {
  const members: DataSnapshot = await database
    .ref(`channel-members/${channelId}`)
    .once('value')
  const values: string[] = []
  members.forEach((member) => {
    if (member.key) { values.push(member.key) }
    return false
  })
  return values
}

export async function getMemberChannelIds(userId: string) {
  const memberships: DataSnapshot = await database
    .ref(`member-channels/${userId}`)
    .once('value')
  const values: string[] = []
  memberships.forEach((membership) => {
    if (membership.key) { values.push(membership.key) }
    return false
  })
  return values
}

export async function getMembersToNotify(channelId: string, exclude: string[]) {
  const members: DataSnapshot = await database
    .ref(`channel-members/${channelId}`)
    .once('value')
  const values: string[] = []
  members.forEach((member) => {
    if (member.key && !member.val().muted && !(exclude.indexOf(member.key) > -1)) {
      values.push(member.key)
    }
    return false
  })
  return values
}

export async function getUser(userId: string) {
  const value: DataSnapshot = await database
    .ref(`users/${userId}`)
    .once('value')
  return value
}

export async function getChannel(channelId: string) {
  const value: DataSnapshot = await database
    .ref(`channels/${channelId}`)
    .once('value')
  return value
}

export function getPhotoFromMessage(message: any) {
  if (message.attachments) {
    for (const prop in message.attachments) {
      if (message.attachments.hasOwnProperty(prop)) {
        return message.attachments[prop].photo
      }
    }
  }
}

export function getAction(event: DatabaseEvent): Action {
  if (!event.data.exists()) {
    return Action.delete
  } else if (!event.data.previous.exists()) {
    return Action.create
  } else {
    return Action.change
  }
}

export async function deleteImageFile(filename: string) {
  const bucket = gcs.bucket('patchr-images-dev')
  const file = bucket.file(filename)
  const data = await file.delete()
}

export function channelMemberMap(userId, timestamp, priorityIndex, role) {
  const joinedAt = timestamp / 1000 // shorten to 10 digits
  const index = parseInt('' + priorities[priorityIndex] + timestamp)
  const indexReversed = parseInt('' + priorities_reversed[priorityIndex] + timestamp) * -1
  const membership = {
    archived: false,
    created_at: timestamp,
    created_by: userId,
    joined_at: joinedAt, // Not a real unix epoch timestamp, only 10 digits instead of 13
    joined_at_desc: joinedAt * -1,
    index_priority_joined_at: index,
    index_priority_joined_at_desc: indexReversed,
    muted: false,
    notifications: 'all',
    priority: priorityIndex,
    role: role,
    starred: false,
  }
  return membership
}

export enum Action {
  create,
  change,
  delete,
}