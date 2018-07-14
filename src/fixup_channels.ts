import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as _ from 'lodash'
import * as request from 'request'

admin.initializeApp({
  databaseURL: 'https://patchr-ios-dev.firebaseio.com',
  credential: admin.credential.cert('service-credentials-dev.json'),
  databaseAuthVariableOverride: {
    uid: 'patchr-cloud-worker',
  },
})

// admin.initializeApp({
//   databaseURL: 'https://patchr-ios.firebaseio.com',
//   credential: admin.credential.cert('service-credentials-prod.json'),
//   databaseAuthVariableOverride: {
//     uid: 'patchr-cloud-worker',
//   },
// })

type Database = admin.database.Database
type DataSnapshot = admin.database.DataSnapshot
const codes = {}
const root = {}

run()

/* jshint -W098 */
async function run() {
  console.log('Photo fixup running...')
  await fixupChannels()
}

async function fixupChannels() {
  const channels = (await admin.database().ref('channels').once('value')).val()
  _.forOwn(channels, async (channel, channelId) => {
    if (channel.general) {
      const user = (await getUser(channel.owned_by)).val()
      const title = `${user.username} channel`
      const name = `${user.username}-channel`
      console.log(`general: old: ${channel.name} new: ${name} id: ${channelId}`)
      const updates = {}
      updates[`channels/${channelId}/title`] = title      
      await admin.database().ref().update(updates)
    } 
    else if (channel.name === 'chatter') {
      console.log(`chatter: ${channel.name} id: ${channelId}`)
      await admin.database().ref(`channels/${channelId}`).remove()
    } 
    else {
      console.log(`custom: ${channel.name} id: ${channelId}`)
    }
  })
}

async function getUser(userId: string) {
  const value: DataSnapshot = await admin.database()
    .ref(`users/${userId}`)
    .once('value')
  return value
}