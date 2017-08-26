/*
 * Common database functions
 */
import * as admin from 'firebase-admin'
import * as shared from './shared'

type Response = admin.messaging.MessagingDevicesResponse

export async function sendMessages(installs: any[], message: string, payloadData: any) {

  const payload: any = {
    notification: {
      body: message,
      sound: 'chirp.caf',
    },
    data: payloadData,
  }

  const options: any = {
    contentAvailable: true,
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
          result.error.code === 'messaging/registration-token-not-registered') {
          console.log(`Removing orphaned install for user: ${userId}: ${token}`)
          tokensToRemove.push(shared.database.ref(`installs/${userId}/${token}`).remove())
        }
      }      
    }
    Promise.all(tokensToRemove)
  }
}