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
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield messages.onWriteMessage(event); }));
exports.onWriteChannel = functions
    .database
    .ref('/channels/{channelId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield channels.onWriteChannel(event); }));
exports.onCreateComment = functions
    .database
    .ref('/channel-messages/{channelId}/{messageId}/comments/{commentId}')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield comments.onWriteComment(event); }));
exports.onCreateReaction = functions
    .database
    .ref('/channel-messages/{channelId}/{messageId}/reactions/{reactionId}')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield reactions.onWriteReaction(event); }));
exports.onCreateMessageUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/message')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(event); }));
exports.onDeleteMessageUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/message')
    .onDelete((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(event); }));
exports.onCreateCommentUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(event); }));
exports.onDeleteCommentUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}/comments')
    .onDelete((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(event); }));
exports.onCreateInvite = functions
    .database
    .ref('/invites/{inviteId}')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield invites.onWriteInvite(event); }));
/* Membership */
exports.onWriteChannelMember = functions
    .database
    .ref('/channel-members/{channelId}/{userId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield channel_members.onWriteMember(event); }));
/* Properties */
exports.onUpdateProfile = functions
    .database
    .ref('/users/{userId}/profile')
    .onUpdate((event) => __awaiter(this, void 0, void 0, function* () { return yield users.onWriteProfile(event); }));
exports.onDeleteProfile = functions
    .database
    .ref('/users/{userId}/profile')
    .onDelete((event) => __awaiter(this, void 0, void 0, function* () { return yield users.onWriteProfile(event); }));
exports.onWriteUsername = functions
    .database
    .ref('/users/{userId}/username')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield users.onWriteUsername(event); }));
exports.onDeleteUnreadsCounter = functions
    .database
    .ref('/counters/{userId}/unreads')
    .onDelete((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnreadsCounter(event); }));
/* Auth accounts */
exports.onDeleteAccount = functions
    .auth
    .user()
    .onDelete((event) => __awaiter(this, void 0, void 0, function* () { return yield accounts.onDeleteAccount(event); }));
//# sourceMappingURL=index.js.map