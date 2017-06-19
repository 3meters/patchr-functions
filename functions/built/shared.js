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
/*
 * Common database functions
 */
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp(functions.config().firebase);
exports.messaging = admin.messaging();
exports.database = admin.database();
exports.auth = admin.auth();
// tslint:disable-next-line:no-var-requires
const gcs = require('@google-cloud/storage')();
const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1];
function getMemberIds(groupId, channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!channelId) {
            const members = yield exports.database
                .ref(`group-members/${groupId}`)
                .once('value');
            const values = [];
            members.forEach((member) => {
                if (member.key) {
                    values.push(member.key);
                }
                return false;
            });
            return values;
        }
        else {
            const members = yield exports.database
                .ref(`group-channel-members/${groupId}/${channelId}`)
                .once('value');
            const values = [];
            members.forEach((member) => {
                if (member.key) {
                    values.push(member.key);
                }
                return false;
            });
            return values;
        }
    });
}
exports.getMemberIds = getMemberIds;
function getMemberChannelIds(userId, groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        const memberships = yield exports.database
            .ref(`member-channels/${userId}/${groupId}`)
            .once('value');
        const values = [];
        memberships.forEach((membership) => {
            if (membership.key) {
                values.push(membership.key);
            }
            return false;
        });
        return values;
    });
}
exports.getMemberChannelIds = getMemberChannelIds;
function getMembersToNotify(groupId, channelId, exclude) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = yield exports.database
            .ref(`group-channel-members/${groupId}/${channelId}`)
            .once('value');
        const values = [];
        members.forEach((member) => {
            if (member.key && !member.val().muted && !(exclude.indexOf(member.key) > -1)) {
                values.push(member.key);
            }
            return false;
        });
        return values;
    });
}
exports.getMembersToNotify = getMembersToNotify;
function getUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`users/${userId}`)
            .once('value');
        return value;
    });
}
exports.getUser = getUser;
function getChannel(groupId, channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`group-channels/${groupId}/${channelId}`)
            .once('value');
        return value;
    });
}
exports.getChannel = getChannel;
function getGroup(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`groups/${groupId}`)
            .once('value');
        return value;
    });
}
exports.getGroup = getGroup;
function getPhotoFromMessage(message) {
    if (message.attachments) {
        for (const prop in message.attachments) {
            if (message.attachments.hasOwnProperty(prop)) {
                return message.attachments[prop].photo;
            }
        }
    }
}
exports.getPhotoFromMessage = getPhotoFromMessage;
function getAction(event) {
    if (!event.data.exists()) {
        return Action.delete;
    }
    else if (!event.data.previous.exists()) {
        return Action.create;
    }
    else {
        return Action.change;
    }
}
exports.getAction = getAction;
function deleteImageFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = gcs.bucket('patchr-images-dev');
        const file = bucket.file(filename);
        const data = yield file.delete();
    });
}
exports.deleteImageFile = deleteImageFile;
function channelMemberMap(userId, timestamp, priorityIndex, role) {
    const joinedAt = timestamp / 1000; // shorten to 10 digits
    const index = parseInt('' + priorities[priorityIndex] + timestamp);
    const indexReversed = parseInt('' + priorities_reversed[priorityIndex] + timestamp) * -1;
    const membership = {
        archived: false,
        created_at: timestamp,
        created_by: userId,
        joined_at: joinedAt,
        joined_at_desc: joinedAt * -1,
        index_priority_joined_at: index,
        index_priority_joined_at_desc: indexReversed,
        muted: false,
        priority: priorityIndex,
        role: role,
        starred: false,
    };
    return membership;
}
exports.channelMemberMap = channelMemberMap;
function groupMemberMap(userId, timestamp, priorityIndex, role, email) {
    const joinedAt = timestamp / 1000; // shorten to 10 digits
    const index = parseInt('' + priorities[priorityIndex] + timestamp);
    const indexReversed = parseInt('' + priorities_reversed[priorityIndex] + timestamp) * -1;
    const membership = {
        created_at: timestamp,
        created_by: userId,
        disabled: false,
        joined_at: joinedAt,
        joined_at_desc: joinedAt * -1,
        index_priority_joined_at: index,
        index_priority_joined_at_desc: indexReversed,
        notifications: 'all',
        priority: priorityIndex,
        role: role,
    };
    if (email) {
        membership.email = email;
    }
    return membership;
}
exports.groupMemberMap = groupMemberMap;
var Action;
(function (Action) {
    Action[Action["create"] = 0] = "create";
    Action[Action["change"] = 1] = "change";
    Action[Action["delete"] = 2] = "delete";
})(Action = exports.Action || (exports.Action = {}));
//# sourceMappingURL=shared.js.map