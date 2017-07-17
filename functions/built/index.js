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
const channel_members = require("./channel-members");
const channels = require("./channels");
const invites = require("./invites");
const messages = require("./messages");
const shared = require("./shared");
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
exports.onCreateUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(event); }));
exports.onDeleteUnread = functions
    .database
    .ref('/unreads/{userId}/{channelId}/{messageId}')
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
/* Tasks */
exports.createUser = functions
    .database
    .ref('/tasks/create-user/{taskId}')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () { return yield users.createUser(translate(event)); }));
function translate(event) {
    const task = event.data.val();
    task.adminRef = event.data.adminRef;
    task.action = shared.getAction(event);
    return task;
}
//# sourceMappingURL=index.js.map