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
function onWriteComment(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield created(data);
    });
}
exports.onWriteComment = onWriteComment;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = current.val();
        const commentId = current.key;
        const channelId = comment.channel_id;
        const messageId = comment.message_id;
        const commentCreatedBy = comment.created_by;
        const commentUser = (yield shared.getUser(commentCreatedBy)).val();
        const commentUsername = commentUser.username;
        console.log(`Comment created: ${commentId} for: ${messageId} channel: ${channelId} by: ${commentCreatedBy}`);
        /* Send comment notifications to all channel members except comment creator */
        /* Gather channel members except muted or author */
        const createdBy = (yield shared.getMessageCreatedBy(channelId, messageId));
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
        /* Flag unread and tickle activity for channel members */
        try {
            const updates = {};
            const timestamp = Date.now();
            const timestampReversed = timestamp * -1;
            for (const userId of notifyIds) {
                updates[`unreads/${userId}/${channelId}/${messageId}/comments/${commentId}`] = true;
                updates[`channel-members/${channelId}/${userId}/activity_at`] = timestamp;
                updates[`channel-members/${channelId}/${userId}/activity_at_desc`] = timestampReversed;
                updates[`channel-members/${channelId}/${userId}/activity_by`] = commentCreatedBy;
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
            console.log(`Installs to notify: en = ${installs.en.length}, ru = ${installs.ru.length}`);
            const channelName = (yield shared.getChannel(channelId)).val().name;
            const data = {
                user_id: commentCreatedBy,
                channel_id: channelId,
                message_id: messageId,
            };
            /* English */
            if (installs.en.length > 0) {
                const notificationText = `#${channelName} @${commentUsername}: commented on a post: ${comment.text}`;
                yield notifications.sendMessages(installs.en, notificationText, data);
            }
            /* Russian */
            if (installs.ru.length > 0) {
                const notificationText = `#${channelName} @${commentUsername}: прокомментировал(а) публикацию: ${comment.text}`;
                yield notifications.sendMessages(installs.ru, notificationText, data);
            }
        }
        catch (err) {
            console.error('Error processing new comment notifications: ', err);
            return;
        }
    });
}
//# sourceMappingURL=comments.js.map