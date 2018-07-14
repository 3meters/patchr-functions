"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const accounts = require("./accounts");
const channel_members = require("./channel-members");
const channels = require("./channels");
const comments = require("./comments");
const invites = require("./invites");
const messages = require("./messages");
const reactions = require("./reactions");
const unreads = require("./unreads");
const users = require("./users");
// /* Exports */
exports.onWriteMessage = functions
    .database
    .ref('/channel-messages/{channelId}/{messageId}')
    .onWrite((data, context) => __awaiter(this, void 0, void 0, function* () { return yield messages.onWriteMessage(data, context); }));
exports.onWriteChannel = functions
    .database
    .ref('/channels/{channelId}')
    .onWrite((data, context) => __awaiter(this, void 0, void 0, function* () { return yield channels.onWriteChannel(data, context); }));
exports.onCreateComment = functions
    .database
    .ref('/channel-messages/{channelId}/{messageId}/comments/{commentId}')
    .onCreate((data, context) => __awaiter(this, void 0, void 0, function* () { return yield comments.onWriteComment(data, context); }));
exports.onCreateReaction = functions
    .database
    .ref('/channel-messages/{channelId}/{messageId}/reactions/{reactionId}')
    .onCreate((data, context) => __awaiter(this, void 0, void 0, function* () { return yield reactions.onWriteReaction(data, context); }));
exports.onCreateMessageUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/message')
    .onCreate((data, context) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(data, context); }));
exports.onDeleteMessageUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/message')
    .onDelete((data, context) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onDeleteUnread(data, context); }));
exports.onCreateCommentUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
    .onCreate((data, context) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(data, context); }));
exports.onDeleteCommentUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
    .onDelete((data, context) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onDeleteUnread(data, context); }));
exports.onCreateInvite = functions
    .database
    .ref('/invites/{inviteId}')
    .onCreate((data, context) => __awaiter(this, void 0, void 0, function* () { return yield invites.onWriteInvite(data, context); }));
/* Membership */
exports.onWriteChannelMember = functions
    .database
    .ref('/channel-members/{channelId}/{userId}')
    .onWrite((data, context) => __awaiter(this, void 0, void 0, function* () { return yield channel_members.onWriteMember(data, context); }));
/* Properties */
exports.onUpdateProfile = functions
    .database
    .ref('/users/{userId}/profile')
    .onUpdate((data, context) => __awaiter(this, void 0, void 0, function* () { return yield users.onUpdateProfile(data, context); }));
exports.onDeleteProfile = functions
    .database
    .ref('/users/{userId}/profile')
    .onDelete((data, context) => __awaiter(this, void 0, void 0, function* () { return yield users.onDeleteProfile(data, context); }));
exports.onWriteUsername = functions
    .database
    .ref('/users/{userId}/username')
    .onWrite((data, context) => __awaiter(this, void 0, void 0, function* () { return yield users.onWriteUsername(data, context); }));
exports.onDeleteUnreadsCounter = functions
    .database
    .ref('/counters/{userId}/unreads')
    .onDelete((data, context) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnreadsCounter(data, context); }));
/* Auth accounts */
exports.onDeleteAccount = functions
    .auth
    .user()
    .onDelete((user, context) => __awaiter(this, void 0, void 0, function* () { return yield accounts.onDeleteAccount(user, context); }));
//# sourceMappingURL=index.js.map