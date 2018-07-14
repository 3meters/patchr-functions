/*
 * Common database functions
 */
import * as admin from 'firebase-admin'
import * as shared from './shared'

type Response = admin.messaging.MessagingDevicesResponse
type Payload = admin.messaging.MessagingPayload
type DataPayload = admin.messaging.DataMessagePayload
type Options = admin.messaging.MessagingOptions

export async function sendMessages(installs: any[], message: string, payloadData: DataPayload) {

  const payload: Payload = {}
  payload.data = payloadData
  payload.notification = {
    body: message,
    sound: 'chirp.caf',
  }

  const options: Options = {
    priority: 'high',
  }

  for (const install of installs) {
    if (install.unreads) {
      payload.notification.badge = '' + install.unreads // force to string
    }
    const token: string = install.id
    const userId: string = install.userId
    const response: Response = await shared.messaging.sendToDevice(token, payload, options)
    const tokensToRemove: any[] = []
    for (const result of response.results) {
      if (result.error) {
        /* Cleanup the tokens who are not registered anymore. */
        if (result.error.code === 'messaging/invalid-registration-token' ||
          result.error.code === 'messaging/mismatched-credential' ||
          result.error.code === 'messaging/registration-token-not-registered') {
          console.log(`Removing orphaned install for user: ${userId}: ${token}`)
          tokensToRemove.push(shared.database.ref(`installs/${userId}/${token}`).remove())
        }
      }      
    }
    await Promise.all(tokensToRemove)
  }
}

export async function gatherInstalls(memberId: string, installs: any[]) {
  const unreads: number = ((await shared.database.ref(`counters/${memberId}/unreads`).once('value')).val() || 0) + 1
  const snaps: shared.DataSnapshot = await shared.database.ref(`installs/${memberId}`).once('value')
  snaps.forEach((install) => {
    if (install.key) {
      installs.push({ id: install.key, userId: memberId, unreads: unreads })         
    }
    return false
  })
}
