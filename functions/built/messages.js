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
        const messageRef = current.adminRef;
        const messageId = current.key;
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
            for (const userId of notifyIds) {
                updates[`unreads/${userId}/${channelId}/${messageId}/message`] = true;
                updates[`member-channels/${userId}/${channelId}/activity_at`] = message.created_at;
                updates[`member-channels/${userId}/${channelId}/activity_at_desc`] = message.created_at_desc;
                updates[`member-channels/${userId}/${channelId}/activity_by`] = createdBy;
                updates[`channel-members/${channelId}/${userId}/activity_at`] = message.created_at;
                updates[`channel-members/${channelId}/${userId}/activity_at_desc`] = message.created_at_desc;
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
            const data = {
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
                yield notifications.sendMessages(installs.en, notificationText, data);
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
                yield notifications.sendMessages(installs.ru, notificationText, data);
            }
        }
        catch (err) {
            console.error('Error processing new message notifications: ', err);
            return;
        }
    });
}
function updated(previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const messageId = current.key;
        const channelId = current.val().channel_id;
        const previousPhoto = shared.getPhotoFromMessage(previous.val());
        const currentPhoto = shared.getPhotoFromMessage(current.val());
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
function onWriteCommentsCounter(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(event) !== Action.delete) {
            return;
        }
        if (!event.params) {
            return;
        }
        const channelId = event.params.channelId;
        const messageId = event.params.messageId;
        const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`);
        const commentsRef = shared.database.ref(`/message-comments/${channelId}/${messageId}`);
        try {
            const comments = yield commentsRef.once('value');
            const count = comments.numChildren();
            yield countRef.set(count);
            console.log(`Recounting comments for ${messageId} total ${count}`);
        }
        catch (err) {
            console.error(`Error counting comments: ${err.message}`);
        }
    });
}
exports.onWriteCommentsCounter = onWriteCommentsCounter;
//# sourceMappingURL=messages.js.map