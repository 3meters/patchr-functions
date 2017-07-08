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
  // await fixupPhotos()
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

  async.eachLimit(filenames, 5, (filename, next)=> {
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
    }
    else {
      console.log(`Total images: ${count}`)
    }
  })
}

async function fixupPhotos() {
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
                message.ref.child(path).set('google-storage')
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