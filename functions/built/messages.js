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
const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1];
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
        /* Gather list of channel members */
        const memberIds = yield shared.getMembersToNotify(channelId, [message.created_by]);
        if (memberIds.length === 0) {
            return;
        }
        console.log('Channel members to notify: ' + memberIds.length);
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
            for (const memberId of memberIds) {
                promises.push(notify(memberId, installs));
            }
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
                yield shared.database.ref(`unreads/${memberId}/${channelId}/${messageId}`).set(true);
                const membership = yield shared.database.ref(`member-channels/${memberId}/${channelId}`).once('value');
                /* Bump sort priority */
                if (membership.val().priority !== 0) {
                    const timestamp = membership.val().joined_at; // not a real timestamp, shortened to 10 digits
                    yield membership.ref.update({
                        priority: 0,
                        index_priority_joined_at: parseInt('' + priorities[0] + timestamp),
                        index_priority_joined_at_desc: parseInt('' + priorities_reversed[0] + timestamp) * -1,
                    });
                }
                /* Find installs to notify */
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