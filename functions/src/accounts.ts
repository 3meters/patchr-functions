/*
 * User processing
 */
import * as shared from './shared'
import * as utils from './utils'

export async function onDeleteAccount(event: shared.AuthEvent) {
  const user: shared.UserRecord = event.data
  const userId = user.uid
  const username: string = (await shared.getUser(userId)).val().username
  const ownedChannelIds: string[] = await shared.getOwnedChannelIds(userId)
  
  const updates = {}
  console.log(`Releasing username: ${username}`)
  updates[`usernames/${username}`] = null

  if (ownedChannelIds.length > 0) { 
    ownedChannelIds.forEach((channelId) => {
      updates[`channels/${channelId}`] = null
    })
  }
  await shared.database.ref().update(updates)
}