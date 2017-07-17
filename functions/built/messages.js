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
 * Message processing
 */
const notifications = require("./notifications");
const shared = require("./shared");
const Action = shared.Action;
function onWriteMessage(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(event) === Action.create) {
            yield created(event.data.current);
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.data.previous);
        }
        else if (shared.getAction(event) === Action.change) {
            yield updated(event.data.previous, event.data.current);
        }
    });
}
exports.onWriteMessage = onWriteMessage;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = current.val();
        const channelId = message.channel_id;
        const messageId = current.key;
        const createdBy = message.created_by;
        console.log(`Message created: ${messageId}`);
        /* Members that need activity tickle */
        const memberIds = yield shared.getMemberIds(channelId);
        if (memberIds.length > 0) {
            const updates = {};
            memberIds.forEach((memberId) => {
                updates[`channel-members/${channelId}/${memberId}/activity_at`] = message.created_at;
                updates[`channel-members/${channelId}/${memberId}/activity_at_desc`] = message.created_at_desc;
                updates[`channel-members/${channelId}/${memberId}/activity_by`] = message.created_by;
                updates[`member-channels/${memberId}/${channelId}/activity_at`] = message.created_at;
                updates[`member-channels/${memberId}/${channelId}/activity_at_desc`] = message.created_at_desc;
                updates[`member-channels/${memberId}/${channelId}/activity_by`] = message.created_by;
            });
            yield shared.database.ref().update(updates);
        }
        /* Gather list of channel members to notify */
        const notifyIds = yield shared.getMembersToNotify(channelId, [message.created_by]);
        if (notifyIds.length === 0) {
            return;
        }
        console.log('Channel members to notify: ' + notifyIds.length);
        const username = (yield shared.getUser(createdBy)).val().username;
        const channelName = (yield shared.getChannel(channelId)).val().name;
        const data = {
            user_id: createdBy,
            channel_id: channelId,
            message_id: messageId,
        };
        let notificationText = '';
        if (message.photo) {
            notificationText = `#${channelName} @${username}: @${username} posted a photo`;
            if (message.text) {
                notificationText += ` and commented: ${message.text}`;
            }
        }
        else if (message.text) {
            notificationText = `#${channelName} @${username}: ${message.text}`;
        }
        try {
            const installs = [];
            const promises = [];
            const updates = {};
            for (const notifyId of notifyIds) {
                updates[`unreads/${notifyId}/${channelId}/${messageId}`] = true;
                updates[`channel-members/${channelId}/${notifyId}/activity_at`] = message.created_at;
                updates[`channel-members/${channelId}/${notifyId}/activity_at_desc`] = message.created_at_desc;
                updates[`channel-members/${channelId}/${notifyId}/activity_by`] = message.created_by;
                updates[`member-channels/${notifyId}/${channelId}/activity_at`] = message.created_at;
                updates[`member-channels/${notifyId}/${channelId}/activity_at_desc`] = message.created_at_desc;
                updates[`member-channels/${notifyId}/${channelId}/activity_by`] = message.created_by;
                promises.push(notify(notifyId, installs));
            }
            yield shared.database.ref().update(updates);
            yield Promise.all(promises);
            if (installs.length > 0) {
                yield notifications.sendMessages(installs, notificationText, data);
            }
        }
        catch (err) {
            console.error('Error updating unreads and sort priority: ', err);
            return;
        }
        function notify(memberId, installs) {
            return __awaiter(this, void 0, void 0, function* () {
                const unreads = ((yield shared.database.ref(`counters/${memberId}/unreads`).once('value')).val() || 0) + 1;
                const snaps = yield shared.database.ref(`installs/${memberId}`).once('value');
                snaps.forEach((install) => {
                    if (install.key) {
                        installs.push({ id: install.key, userId: memberId, unreads: unreads });
                    }
                    return false;
                });
            });
        }
    });
}
function updated(previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = current.key;
        const previousPhoto = shared.getPhotoFromMessage(previous.val());
        const currentPhoto = shared.getPhotoFromMessage(current.val());
        console.log(`Message updated: ${messageId}`);
        if (previousPhoto) {
            if (!currentPhoto || previousPhoto.filename !== currentPhoto.filename) {
                if (previousPhoto.source === 'google-storage') {
                    console.log(`Deleting image file: ${previousPhoto.filename}`);
                    yield shared.deleteImageFile(previousPhoto.filename);
                }
            }
        }
    });
}
function deleted(previous) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = previous.val().channel_id;
        const messageId = previous.key;
        const photo = shared.getPhotoFromMessage(previous.val());
        console.log(`Message deleted: ${messageId}`);
        /* Clear unread flag for each member */
        const memberIds = yield shared.getMemberIds(channelId);
        if (memberIds.length > 0) {
            const updates = {};
            memberIds.forEach((memberId) => {
                updates[`unreads/${memberId}/${channelId}/${messageId}`] = null;
            });
            yield shared.database.ref().update(updates);
        }
        /* Delete image file if needed */
        if (photo) {
            if (photo.source === 'google-storage') {
                console.log(`Deleting image file: ${photo.filename}`);
                yield shared.deleteImageFile(photo.filename);
            }
        }
    });
}
//# sourceMappingURL=messages.js.map