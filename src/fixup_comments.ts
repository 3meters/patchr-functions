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
  console.log('Export transform running...')
  await copy()
  await transformMessages()
  const stream: fs.WriteStream = fs.createWriteStream('patchr_database.json')
  stream.write(JSON.stringify(root, null, 2))
  console.log('Database file saved')
}

async function copy() {
  const channelMembers = (await admin.database().ref('channel-members').once('value')).val()
  const channelMessages = (await admin.database().ref('channel-messages').once('value')).val()
  const channels = (await admin.database().ref('channels').once('value')).val()
  const clients = (await admin.database().ref('clients').once('value')).val()
  const counters = (await admin.database().ref('counters').once('value')).val()
  const installs = (await admin.database().ref('installs').once('value')).val()
  const memberChannels = (await admin.database().ref('member-channels').once('value')).val()
  const messageComments = (await admin.database().ref('message-comments').once('value')).val()
  const unreads = (await admin.database().ref('unreads').once('value')).val()
  const usernames = (await admin.database().ref('usernames').once('value')).val()
  const users = (await admin.database().ref('users').once('value')).val()
  root['channel-members'] = channelMembers
  root['channel-messages'] = channelMessages
  root['channels'] = channels
  root['clients'] = clients
  root['counters'] = counters
  root['installs'] = installs
  root['member-channels'] = memberChannels
  root['message-comments'] = messageComments
  root['unreads'] = unreads
  root['usernames'] = usernames
  root['users'] = users
}

async function transformMessages() {
  const channels = (await admin.database().ref('message-comments').once('value')).val()
  console.log('comments:', channels)
  _.forOwn(channels, (channel, channelId) => {
    _.forOwn(channel, (message, messageId) => {
      console.log(`channelId: ${channelId}, messageId: ${messageId}`)
      root['channel-messages'][channelId][messageId]['comments'] = message
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