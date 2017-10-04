import * as functions from 'firebase-functions'
import * as accounts from './accounts'
import * as channel_members from './channel-members'
import * as channels from './channels'
import * as comments from './comments'
import * as invites from './invites'
import * as messages from './messages'
import * as shared from './shared'
import * as unreads from './unreads'
import * as users from './users'

// /* Exports */

export let onWriteMessage = functions
  .database
  .ref('/channel-messages/{channelId}/{messageId}')
  .onWrite(async (event) => await messages.onWriteMessage(event))

export let onWriteChannel = functions
  .database
  .ref('/channels/{channelId}')
  .onWrite(async (event) => await channels.onWriteChannel(event))

export let onCreateComment = functions
  .database
  .ref('/message-comments/{channelId}/{messageId}/{commentId}')
  .onCreate(async (event) => await comments.onWriteComment(event))

export let onCreateMessageUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/message')
  .onCreate(async (event) => await unreads.onWriteUnread(event))

export let onDeleteMessageUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/message')
  .onDelete(async (event) => await unreads.onWriteUnread(event))

export let onCreateCommentUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
  .onCreate(async (event) => await unreads.onWriteUnread(event))

export let onDeleteCommentUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
  .onDelete(async (event) => await unreads.onWriteUnread(event))

export let onCreateInvite = functions
  .database
  .ref('/invites/{inviteId}')
  .onCreate(async (event) => await invites.onWriteInvite(event))

/* Membership */

export let onWriteChannelMember = functions
  .database
  .ref('/channel-members/{channelId}/{userId}')
  .onWrite(async (event) => await channel_members.onWriteMember(event))

/* Properties */

export let onUpdateProfile = functions
  .database
  .ref('/users/{userId}/profile')
  .onUpdate(async (event) => await users.onWriteProfile(event))

export let onDeleteProfile = functions
  .database
  .ref('/users/{userId}/profile')
  .onDelete(async (event) => await users.onWriteProfile(event))

export let onWriteUsername = functions
  .database
  .ref('/users/{userId}/username')
  .onWrite(async (event) => await users.onWriteUsername(event))

export let onDeleteUnreadsCounter = functions
  .database
  .ref('/counters/{userId}/unreads')
  .onDelete(async (event) => await unreads.onWriteUnreadsCounter(event))

/* Auth accounts */

export let onDeleteAccount = functions
  .auth
  .user()
  .onDelete(async (event) => await accounts.onDeleteAccount(event))