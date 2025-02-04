import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as _ from 'lodash'
import * as request from 'request'

// admin.initializeApp({
//   databaseURL: 'https://patchr-ios-dev.firebaseio.com',
//   credential: admin.credential.cert('service-credentials-dev.json'),
//   databaseAuthVariableOverride: {
//     uid: 'patchr-cloud-worker',
//   },
// })

admin.initializeApp({
  databaseURL: 'https://patchr-ios.firebaseio.com',
  credential: admin.credential.cert('service-credentials-prod.json'),
  databaseAuthVariableOverride: {
    uid: 'patchr-cloud-worker',
  },
})

type Database = admin.database.Database
type DataSnapshot = admin.database.DataSnapshot
const codes = {}
const root = {}

run()

/* jshint -W098 */
async function run() {
  /*
    channel-names: exclude
    clients: no change
    counters: exclude
    group-channel-members: ** transform **
    group-channels: ** transform **
    group-members: exclude
    group-messages: ** transform **
    groups: exclude
    installs: no change
    member-channels: created as part of group-channel-members
    member-groups: exclude
    typing: exclude
    unreads: exclude
    usernames: no change
    users: no change
  */
  console.log('Export transform running...')
  await transformChannels()
  await transformMembership()
  await transformMessages()
  await copy()
  const stream: fs.WriteStream = fs.createWriteStream('patchr_database.json')
  stream.write(JSON.stringify(root, null, 2))
  console.log('Database file saved')
}

async function copy() {
  const clients = (await admin.database().ref('clients').once('value')).val()
  const installs = (await admin.database().ref('installs').once('value')).val()
  const usernames = (await admin.database().ref('usernames').once('value')).val()
  const users = (await admin.database().ref('users').once('value')).val()
  root['clients'] = clients
  root['installs'] = installs
  root['usernames'] = usernames
  root['users'] = users
}

async function transformChannels() {
  root['channels'] = {}
  const groups = (await admin.database().ref('group-channels').once('value')).val()
  _.forOwn(groups, (group, groupId) => {
    _.forOwn(group, (channel, channelId) => {
      delete channel.group_id
      delete channel.archived
      delete channel.type
      delete channel.visibility
      delete channel.topic
      if (channel.general || channel.name === 'chatter') {
        delete channel.purpose
      }
      channel.code = generateRandomId(12)
      codes[channelId] = channel.code
      channel.title = titleize(channel.name)
      root['channels'][channelId] = channel
    })
  })
}

async function transformMembership() {
  root['channel-members'] = {}
  root['member-channels'] = {}
  const groups = (await admin.database().ref('group-channel-members').once('value')).val()
  _.forOwn(groups, (group, groupId) => {
    _.forOwn(group, (channel, channelId) => {
      _.forOwn(channel, (membership, userId) => {
        membership.code = codes[channelId]
        membership.notifications = 'all'
        if (membership.muted) {
          membership.notifications = 'none'
        }
        if (membership.role === 'member') {
          membership.role = 'editor'
        } else if (membership.role === 'visitor') {
          membership.role = 'reader'
        }
        if (!root['channel-members'][channelId]) {
          root['channel-members'][channelId] = {}
        }
        if (!root['member-channels'][userId]) {
          root['member-channels'][userId] = {}
        }
        delete membership.archived
        delete membership.muted
        delete membership.unread
        membership.created_at = (membership.created_at < 15006661874) ? membership.created_at * 1000 : membership.created_at
        membership.activity_at = membership.created_at
        membership.activity_at_desc = membership.activity_at * -1
        membership.activity_by = membership.created_by
        delete membership.index_priority_joined_at
        delete membership.index_priority_joined_at_desc
        delete membership.joined_at
        delete membership.joined_at_desc
        delete membership.priority
        membership.starred = membership.starred || false
        root['channel-members'][channelId][userId] = membership
        root['member-channels'][userId][channelId] = membership
      })
    })
  })
}

async function transformMessages() {
  root['channel-messages'] = {}
  const groups = (await admin.database().ref('group-messages').once('value')).val()
  _.forOwn(groups, (group, groupId) => {
    _.forOwn(group, (channel, channelId) => {
      _.forOwn(channel, (message, messageId) => {
        if (!root['channel-messages'][channelId]) {
          root['channel-messages'][channelId] = {}
        }
        delete message.group_id
        if (message.source !== 'system') {
          delete message.source
          root['channel-messages'][channelId][messageId] = message
        }
      })
    })
  })
}

function titleize(slug) {
  const words = slug.split('-')
  return words.map((word) => {
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  }).join(' ')
}

function generateRandomId(digits: number): string {
  // No dupes in 100 runs of one million if using 9
  const charSet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charSetSize = charSet.length
  let id = ''
  for (let i = 1; i <= digits; i++) {
    const randPos = Math.floor(Math.random() * charSetSize)
    id += charSet[randPos]
  }
  return id
}