import * as functions from 'firebase-functions'
import * as accounts from './accounts'
import * as channel_members from './channel-members'
import * as channels from './channels'
import * as comments from './comments'
import * as invites from './invites'
import * as messages from './messages'
import * as reactions from './reactions'
import * as unreads from './unreads'
import * as users from './users'

// /* Exports */

export let onWriteMessage = functions
  .database
  .ref('/channel-messages/{channelId}/{messageId}')
  .onWrite(async (data, context) => await messages.onWriteMessage(data, context))

export let onWriteChannel = functions
  .database
  .ref('/channels/{channelId}')
  .onWrite(async (data, context) => await channels.onWriteChannel(data, context))

export let onCreateComment = functions
  .database
  .ref('/channel-messages/{channelId}/{messageId}/comments/{commentId}')
  .onCreate(async (data, context) => await comments.onWriteComment(data, context))

export let onCreateReaction = functions
  .database
  .ref('/channel-messages/{channelId}/{messageId}/reactions/{reactionId}')
  .onCreate(async (data, context) => await reactions.onWriteReaction(data, context))

export let onCreateMessageUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/message')
  .onCreate(async (data, context) => await unreads.onWriteUnread(data, context))

export let onDeleteMessageUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/message')
  .onDelete(async (data, context) => await unreads.onDeleteUnread(data, context))

export let onCreateCommentUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
  .onCreate(async (data, context) => await unreads.onWriteUnread(data, context))

export let onDeleteCommentUnread = functions
  .database
  .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
  .onDelete(async (data, context) => await unreads.onDeleteUnread(data, context))

export let onCreateInvite = functions
  .database
  .ref('/invites/{inviteId}')
  .onCreate(async (data, context) => await invites.onWriteInvite(data, context))

/* Membership */

export let onWriteChannelMember = functions
  .database
  .ref('/channel-members/{channelId}/{userId}')
  .onWrite(async (data, context) => await channel_members.onWriteMember(data, context))

/* Properties */

export let onUpdateProfile = functions
  .database
  .ref('/users/{userId}/profile')
  .onUpdate(async (data, context) => await users.onUpdateProfile(data, context))

export let onDeleteProfile = functions
  .database
  .ref('/users/{userId}/profile')
  .onDelete(async (data, context) => await users.onDeleteProfile(data, context))

export let onWriteUsername = functions
  .database
  .ref('/users/{userId}/username')
  .onWrite(async (data, context) => await users.onWriteUsername(data, context))

export let onDeleteUnreadsCounter = functions
  .database
  .ref('/counters/{userId}/unreads')
  .onDelete(async (data, context) => await unreads.onWriteUnreadsCounter(data, context))

/* Auth accounts */

export let onDeleteAccount = functions
  .auth
  .user()
  .onDelete(async (user, context) => await accounts.onDeleteAccount(user, context))