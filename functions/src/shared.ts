/*
 * Common database functions
 */
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import * as slugifyjs from 'slugify'

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

export function slugify(title: string) {
  return slugifyjs(title)
}

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

export async function getOwnedChannelIds(userId: string) {
  const channels: DataSnapshot = await database
    .ref('channels')
    .orderByChild('owned_by')
    .equalTo(userId)
    .once('value')
  const values: string[] = []
  channels.forEach((channel) => {
    if (channel.key) { values.push(channel.key) }
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
    if (member.key && member.val().notifications !== 'none' && !(exclude.indexOf(member.key) > -1)) {
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

export async function getMessage(channelId: string, messageId: string) {
  const value: DataSnapshot = await database
    .ref(`channel-messages/${channelId}/${messageId}`)
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
  const bucket = gcs.bucket('patchr-images')
  const file = bucket.file(filename)
  const data = await file.delete()
}

export function channelMemberMap(userId: string, timestamp: number, role: string, code: string) {
  const membership = {
    activity_at: timestamp,
    activity_at_desc: timestamp * -1,
    activity_by: userId,
    code: code,
    created_at: timestamp,
    created_by: userId,
    notifications: 'all',
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