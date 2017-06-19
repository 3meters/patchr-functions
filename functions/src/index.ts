import * as functions from 'firebase-functions'
import * as channel_members from './channel-members'
import * as channels from './channels'
import * as group_members from './group-members'
import * as groups from './groups'
import * as invites from './invites'
import * as messages from './messages'
import * as shared from './shared'
import * as unreads from './unreads'
import * as users from './users'

/* Exports */

export let onWriteMessage = functions
  .database
  .ref('/group-messages/{groupId}/{channelId}/{messageId}')
  .onWrite(async (event) => await messages.onWriteMessage(event))

export let onWriteChannel = functions
  .database
  .ref('/group-channels/{groupId}/{channelId}')
  .onWrite(async (event) => await channels.onWriteChannel(event))

export let onWriteGroup = functions
  .database
  .ref('/groups/{groupId}')
  .onWrite(async (event) => await groups.onWriteGroup(event))

export let onWriteInvite = functions
  .database
  .ref('/invites/{groupId}/{userId}/{inviteId}')
  .onWrite(async (event) => await invites.onWriteInvite(event))

export let onWriteUnread = functions
  .database
  .ref('/unreads/{userId}/{groupId}/{channelId}/{messageId}')
  .onWrite(async (event) => await unreads.onWriteUnread(event))

/* Membership */

export let onWriteChannelMember = functions
  .database
  .ref('/group-channel-members/{groupId}/{channelId}/{userId}')
  .onWrite(async (event) => await channel_members.onWriteMember(event))

export let onWriteGroupMember = functions
  .database
  .ref('/group-members/{groupId}/{userId}')
  .onWrite(async (event) => await group_members.onWriteMember(event))

/* Properties */

export let onWriteProfile = functions
  .database
  .ref('/users/{userId}/profile')
  .onWrite(async (event) => await users.onWriteProfile(event))

export let onWriteUsername = functions
  .database
  .ref('/users/{userId}/username')
  .onWrite(async (event) => await users.onWriteUsername(event))

export let onWriteUnreadsCounter = functions
  .database
  .ref('/counters/{userId}/unreads')
  .onWrite(async (event) => await unreads.onWriteUnreadsCounter(event))

/* Tasks */

export let createUser = functions
  .database
  .ref('/tasks/create-user/{taskId}')
  .onWrite(async (event) => {
    if (shared.getAction(event) === shared.Action.create) {
      await users.createUser(translate(event))
    }
  })

function translate(event: shared.DatabaseEvent) {
  const task = event.data.val()
  task.adminRef = event.data.adminRef
  task.action = shared.getAction(event)
  return task
}