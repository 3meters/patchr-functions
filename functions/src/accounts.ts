/*
 * User processing
 */
import * as shared from './shared'
import * as utils from './utils'

export async function onDeleteAccount(event: shared.AuthEvent) {
  const user: shared.UserRecord = event.data
  const userId = user.uid
  const ownedChannelIds: string[] = await shared.getOwnedChannelIds(userId)
  const memberChannelIds: string[] = await shared.getMemberChannelIds(userId)
  const updates = {}

  /* We remove everything except content.
    - messages: show user as deleted.
    - reactions: show user as deleted.
    - comments: show user as deleted. */

  console.log(`Deleting user: ${userId}`)
  updates[`users/${userId}`] = null // Also trigger release of username

  /* Delete all owned channels */
  if (ownedChannelIds.length > 0) { 
    ownedChannelIds.forEach((channelId) => {
      updates[`channels/${channelId}`] = null
    })
  }

  /* Remove all channel memberships */
  if (memberChannelIds.length > 0) { 
    memberChannelIds.forEach((channelId) => {
      updates[`channel-members/${channelId}/${userId}`] = null
    })
  }

  /* Remove activity */
  updates[`activity/${userId}`] = null
  
  await shared.database.ref().update(updates)
}