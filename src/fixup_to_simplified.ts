import * as async from 'async'
import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as request from 'request'

admin.initializeApp({
  databaseURL: 'https://patchr-ios-dev.firebaseio.com',
  credential: admin.credential.cert('service-credentials-dev.json'),
  databaseAuthVariableOverride: {
    uid: 'patchr-cloud-worker',
  },
})

type Database = admin.database.Database
type DataSnapshot = admin.database.DataSnapshot

// tslint:disable-next-line:no-var-requires
const gcs = require('@google-cloud/storage')({
  projectId: 'patchr-ios-dev',
  keyFilename: 'service-credentials-dev.json',
})

run()

/* jshint -W098 */
async function run() {
  console.log('Export transform running...')
  await transformUnreads()
}

async function transformUnreads() {
  const unreads: DataSnapshot = await admin.database().ref('unreads').once('value')
  unreads.forEach((user) => {
    const userId = user.key
    user.forEach((group) => {
      group.forEach((channel) => {
        const channelId = channel.key
        if (userId && channelId) {
          admin.database().ref(`unreads-v2/${userId}/${channelId}`).set(channel.val())
        }
        return false
      })
      return false
    })
    return false
  })
}

async function fixupMessagePhotos() {
  const groups: DataSnapshot = await admin.database()
    .ref('group-messages')
    .once('value')
  let count = 0
  groups.forEach((group) => {
    group.forEach((channel) => {
      channel.forEach((message) => {
        if (message.val().attachments) {
          for (const prop in message.val().attachments) {
            if (message.val().attachments.hasOwnProperty(prop)) {
              const photo = message.val().attachments[prop].photo
              if (photo.source === 'aircandi.images') {
                count++
                const path = `attachments/${prop}/photo/source`
                console.log(`Updating photo source: ${photo.filename}`)
                console.log(`Path: ${message.ref}/${path}`)
                // message.ref.child(path).set('google-storage')
              }
            }
          }
        }
        return false
      })
      return false
    })
    return false
  })
  console.log(`Total images: ${count}`)
}

async function fixupUserPhotos() {
  const users: DataSnapshot = await admin.database()
    .ref('users')
    .once('value')
  let count = 0
  users.forEach((user) => {
    if (user.val().profile && user.val().profile.photo) {
      const photo = user.val().profile.photo
      if (photo.source === 'aircandi.images') {
        count++
        const path = `profile/photo/source`
        console.log(`Updating photo source: ${photo.filename}`)
        console.log(`Path: ${user.ref}/${path}`)
        user.ref.child(path).set('google-storage')
      }
    }
    return false
  })
  console.log(`Total images: ${count}`)
}

async function fixupGroupPhotos() {
  const groups: DataSnapshot = await admin.database()
    .ref('groups')
    .once('value')
  let count = 0
  groups.forEach((group) => {
    if (group.val().photo) {
      const photo = group.val().photo
      if (photo.source === 'aircandi.images') {
        count++
        const path = `photo/source`
        console.log(`Updating photo source: ${photo.filename}`)
        console.log(`Path: ${group.ref}/${path}`)
        group.ref.child(path).set('google-storage')
      }
    }
    return false
  })
  console.log(`Total images: ${count}`)
}

async function fixupChannelPhotos() {
  const bucket = gcs.bucket('patchr-images')
  const groups: DataSnapshot = await admin.database()
    .ref('group-channels')
    .once('value')
  let count = 0
  groups.forEach((group) => {
    group.forEach((channel) => {
      if (channel.val().photo) {
        const photo = channel.val().photo
        if (photo.source === 'aircandi.images') {
          count++
          const path = `photo/source`
          console.log(`Updating photo source: ${photo.filename}`)
          console.log(`Path: ${channel.ref}/${path}`)
          // channel.ref.child(path).set('google-storage')
        } else {
          bucket.file(photo.filename).exists().then((data) => {
            const exists = data[0]
            if (!exists) {
              console.log(`Clear broken photo: ${photo.filename}`)
              // channel.ref.child('photo').remove()
            }
          })
        }
      }
      return false
    })
    return false
  })
  console.log(`Total images: ${count}`)
}