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
const slugifyjs = require("slugify");
admin.initializeApp();
exports.messaging = admin.messaging();
exports.database = admin.database();
exports.auth = admin.auth();
// tslint:disable-next-line:no-var-requires
const gcs = require('@google-cloud/storage')();
function slugify(title) {
    const slugified = slugifyjs.default(title);
    return slugified.toLowerCase();
}
exports.slugify = slugify;
function getMemberIds(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = yield exports.database
            .ref(`channel-members/${channelId}`)
            .once('value');
        const values = [];
        members.forEach((member) => {
            if (member.key) {
                values.push(member.key);
            }
            return false;
        });
        return values;
    });
}
exports.getMemberIds = getMemberIds;
function getMemberChannelIds(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const memberships = yield exports.database
            .ref(`member-channels/${userId}`)
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
function getOwnedChannelIds(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const channels = yield exports.database
            .ref('channels')
            .orderByChild('owned_by')
            .equalTo(userId)
            .once('value');
        const values = [];
        channels.forEach((channel) => {
            if (channel.key) {
                values.push(channel.key);
            }
            return false;
        });
        return values;
    });
}
exports.getOwnedChannelIds = getOwnedChannelIds;
function getMemberIdsToNotify(channelId, exclude) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = yield exports.database
            .ref(`channel-members/${channelId}`)
            .once('value');
        const values = [];
        members.forEach((member) => {
            if (member.key && member.val().notifications !== 'none' && !(exclude.indexOf(member.key) > -1)) {
                values.push(member.key);
            }
            return false;
        });
        return values;
    });
}
exports.getMemberIdsToNotify = getMemberIdsToNotify;
function getUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`users/${userId}`)
            .once('value');
        return value;
    });
}
exports.getUser = getUser;
function getChannel(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`channels/${channelId}`)
            .once('value');
        return value;
    });
}
exports.getChannel = getChannel;
function getMessage(channelId, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`channel-messages/${channelId}/${messageId}`)
            .once('value');
        return value;
    });
}
exports.getMessage = getMessage;
function getMessageCreatedBy(channelId, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`channel-messages/${channelId}/${messageId}`)
            .once('value');
        return value.val().created_by;
    });
}
exports.getMessageCreatedBy = getMessageCreatedBy;
function getChannelOwnerId(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield exports.database
            .ref(`channels/${channelId}`)
            .once('value');
        return value.val().owned_by;
    });
}
exports.getChannelOwnerId = getChannelOwnerId;
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
function getAction(change) {
    if (!change.after.exists()) {
        return Action.delete;
    }
    else if (!change.before.exists()) {
        return Action.create;
    }
    else {
        return Action.change;
    }
}
exports.getAction = getAction;
function deleteImageFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = gcs.bucket('patchr-images');
        const file = bucket.file(filename);
        const data = yield file.delete();
    });
}
exports.deleteImageFile = deleteImageFile;
function channelMemberMap(userId, timestamp, role, code) {
    const membership = {
        activity_at: timestamp,
        activity_at_desc: timestamp * -1,
        activity_by: userId,
        code: code,
        created_at: timestamp,
        created_by: userId,
        notifications: 'all',
        role: role,
        starred: false,
    };
    return membership;
}
exports.channelMemberMap = channelMemberMap;
var Action;
(function (Action) {
    Action[Action["create"] = 0] = "create";
    Action[Action["change"] = 1] = "change";
    Action[Action["delete"] = 2] = "delete";
})(Action = exports.Action || (exports.Action = {}));
//# sourceMappingURL=shared.js.map