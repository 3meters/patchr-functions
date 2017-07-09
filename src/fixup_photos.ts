import * as async from 'async'
import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as request from 'request'

admin.initializeApp({
  databaseURL: 'https://patchr-ios.firebaseio.com',
  credential: admin.credential.cert('service-credentials-prod.json'),
  databaseAuthVariableOverride: {
    uid: 'patchr-cloud-worker',
  },
})

type Database = admin.database.Database
type DataSnapshot = admin.database.DataSnapshot

// tslint:disable-next-line:no-var-requires
const gcs = require('@google-cloud/storage')({
  projectId: 'patchr-ios',
  keyFilename: 'service-credentials-prod.json',
})

run()

/* jshint -W098 */
async function run() {
  console.log('Photo fixup running...')
  await fixupChannelPhotos()
}

async function transferImages() {
  const metadata = { metadata: { contentType: 'image/jpeg' } }
  const bucket = gcs.bucket('patchr-images')
  const groups: DataSnapshot = await admin.database()
    .ref('group-messages')
    .once('value')
  let count = 0
  const filenames: string[] = []
  groups.forEach((group) => {
    group.forEach((channel) => {
      channel.forEach((message) => {
        if (message.val().attachments) {
          for (const prop in message.val().attachments) {
            if (message.val().attachments.hasOwnProperty(prop)) {
              const photo = message.val().attachments[prop].photo
              if (photo.source === 'aircandi.images') {
                count++
                filenames.push(photo.filename)
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

  async.eachLimit(filenames, 5, (filename, next) => {
    const remoteWriteStream: NodeJS.WritableStream = bucket.file(filename).createWriteStream(metadata)
    request
      .get(`https://s3-us-west-2.amazonaws.com/aircandi-images/${filename}`)
      .pipe(remoteWriteStream) // .pipe(fs.createWriteStream(`../images/${filename}`))
      .on('finish', () => {
        console.log(`Image saved: ${filename}`)
        next()
      })
  }, (err) => {
    if (err) {
      console.log(`A transfer failed`)
    } else {
      console.log(`Total images: ${count}`)
    }
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
        }
        else {
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