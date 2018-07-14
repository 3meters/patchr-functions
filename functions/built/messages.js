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
function onWriteMessage(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(data) === Action.create) {
            yield created(data.after);
        }
        else if (shared.getAction(data) === Action.delete) {
            yield deleted(data.before);
        }
        else if (shared.getAction(data) === Action.change) {
            yield updated(data.before, data.after);
        }
    });
}
exports.onWriteMessage = onWriteMessage;
function created(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = data.val();
        const messageRef = data.ref;
        const messageId = data.key || '';
        const channelId = message.channel_id;
        const createdBy = message.created_by;
        if (message.moving) {
            const updates = { moving: null };
            yield messageRef.update(updates);
            console.log(`Message moved: ${messageId} to: ${channelId} by: ${createdBy}`);
            return;
        }
        console.log(`Message created: ${messageId} for: ${channelId} by: ${createdBy}`);
        /* Gather channel members except muted or author */
        const notifyIds = yield shared.getMemberIdsToNotify(channelId, [createdBy]);
        if (notifyIds.length === 0) {
            return;
        }
        const members = [];
        for (const notifyId of notifyIds) {
            const user = (yield shared.getUser(notifyId)).val();
            const language = user.profile.language ? user.profile.language : 'en';
            members.push({ id: notifyId, language: language });
        }
        console.log('Members to notify count: ', members.length);
        /* Flag unread, tickle activity */
        try {
            const updates = {};
            const timestamp = Date.now();
            const timestampReversed = timestamp * -1;
            for (const userId of notifyIds) {
                updates[`unreads/${userId}/${channelId}/${messageId}/message`] = true;
                updates[`member-channels/${userId}/${channelId}/activity_at`] = timestamp;
                updates[`member-channels/${userId}/${channelId}/activity_at_desc`] = timestampReversed;
                updates[`member-channels/${userId}/${channelId}/activity_by`] = createdBy;
                updates[`channel-members/${channelId}/${userId}/activity_at`] = timestamp;
                updates[`channel-members/${channelId}/${userId}/activity_at_desc`] = timestampReversed;
                updates[`channel-members/${channelId}/${userId}/activity_by`] = createdBy;
            }
            yield shared.database.ref().update(updates);
        }
        catch (err) {
            console.error('Error updating unreads and sort priority: ', err);
            return;
        }
        /* Notify */
        try {
            /* Gather installs */
            const installs = { en: [], ru: [] };
            const promises = [];
            for (const member of members) {
                promises.push(notifications.gatherInstalls(member.id, installs[member.language]));
            }
            yield Promise.all(promises);
            if (installs.en.length === 0 && installs.ru.length === 0) {
                return;
            }
            const username = (yield shared.getUser(createdBy)).val().username;
            const channelName = (yield shared.getChannel(channelId)).val().name;
            const payload = {
                user_id: createdBy,
                channel_id: channelId,
                message_id: messageId,
            };
            const photo = shared.getPhotoFromMessage(message);
            /* English */
            if (installs.en.length > 0) {
                let notificationText = '';
                if (photo) {
                    notificationText = `#${channelName}: @${username} posted a photo`;
                    if (message.text) {
                        notificationText += ` and commented: ${message.text}`;
                    }
                }
                else if (message.text) {
                    notificationText = `#${channelName} @${username}: ${message.text}`;
                }
                yield notifications.sendMessages(installs.en, notificationText, payload);
            }
            /* Russian */
            if (installs.ru.length > 0) {
                let notificationText = '';
                if (photo) {
                    notificationText = `#${channelName}: @${username} опубликовал(а) фото`;
                    if (message.text) {
                        notificationText += ` и прокомментировал(а): ${message.text}`;
                    }
                }
                else if (message.text) {
                    notificationText = `#${channelName} @${username}: ${message.text}`;
                }
                yield notifications.sendMessages(installs.ru, notificationText, payload);
            }
        }
        catch (err) {
            console.error('Error processing new message notifications: ', err);
            return;
        }
    });
}
function updated(before, after) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = after.key;
        const channelId = after.val().channel_id;
        const photoBefore = shared.getPhotoFromMessage(before.val());
        const photoAfter = shared.getPhotoFromMessage(after.val());
        if (photoBefore) {
            if (!photoAfter || photoAfter.filename !== photoBefore.filename) {
                if (photoBefore.source === 'google-storage') {
                    console.log(`Deleting image file: ${photoBefore.filename}`);
                    yield shared.deleteImageFile(photoBefore.filename);
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
        console.log(`Message deleted: ${messageId} for: ${channelId}`);
        const updates = {};
        /* Clear unread flag for each member */
        const memberIds = yield shared.getMemberIds(channelId);
        if (memberIds.length > 0) {
            memberIds.forEach((memberId) => {
                updates[`unreads/${memberId}/${channelId}/${messageId}`] = null;
            });
        }
        /* Clear comments */
        updates[`message-comments/${channelId}/${messageId}`] = null;
        /* Commit updates */
        yield shared.database.ref().update(updates);
        /* Delete image file if needed */
        if (photo && !previous.val().moving) {
            if (photo.source === 'google-storage') {
                console.log(`Deleting image file: ${photo.filename}`);
                yield shared.deleteImageFile(photo.filename);
            }
        }
    });
}
//# sourceMappingURL=messages.js.map