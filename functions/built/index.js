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
const group_members = require("./group-members");
const groups = require("./groups");
const invites = require("./invites");
const messages = require("./messages");
const shared = require("./shared");
const unreads = require("./unreads");
const users = require("./users");
/* Exports */
exports.onWriteMessage = functions
    .database
    .ref('/group-messages/{groupId}/{channelId}/{messageId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield messages.onWriteMessage(event); }));
exports.onWriteChannel = functions
    .database
    .ref('/group-channels/{groupId}/{channelId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield channels.onWriteChannel(event); }));
exports.onWriteGroup = functions
    .database
    .ref('/groups/{groupId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield groups.onWriteGroup(event); }));
exports.onWriteInvite = functions
    .database
    .ref('/invites/{groupId}/{userId}/{inviteId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield invites.onWriteInvite(event); }));
exports.onWriteUnread = functions
    .database
    .ref('/unreads/{userId}/{groupId}/{channelId}/{messageId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnread(event); }));
/* Membership */
exports.onWriteChannelMember = functions
    .database
    .ref('/group-channel-members/{groupId}/{channelId}/{userId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield channel_members.onWriteMember(event); }));
exports.onWriteGroupMember = functions
    .database
    .ref('/group-members/{groupId}/{userId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield group_members.onWriteMember(event); }));
/* Properties */
exports.onWriteProfile = functions
    .database
    .ref('/users/{userId}/profile')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield users.onWriteProfile(event); }));
exports.onWriteUsername = functions
    .database
    .ref('/users/{userId}/username')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield users.onWriteUsername(event); }));
exports.onWriteUnreadsCounter = functions
    .database
    .ref('/counters/{userId}/unreads')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () { return yield unreads.onWriteUnreadsCounter(event); }));
/* Tasks */
exports.createUser = functions
    .database
    .ref('/tasks/create-user/{taskId}')
    .onWrite((event) => __awaiter(this, void 0, void 0, function* () {
    if (shared.getAction(event) === shared.Action.create) {
        yield users.createUser(translate(event));
    }
}));
function translate(event) {
    const task = event.data.val();
    task.adminRef = event.data.adminRef;
    task.action = shared.getAction(event);
    return task;
}
//# sourceMappingURL=index.js.map