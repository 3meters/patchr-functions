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
function onWriteComment(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(event) === Action.create) {
            yield created(event.data.current);
        }
    });
}
exports.onWriteComment = onWriteComment;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const comment = current.val();
        const commentId = current.key;
        const channelId = comment.channel_id;
        const messageId = comment.message_id;
        console.log(`Comment created: ${commentId} for: ${messageId} channel: ${channelId} by: ${comment.created_by}`);
        /* Increment comment counter on message */
        try {
            const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`);
            yield countRef.transaction((cur) => {
                return (cur || 0) + 1;
            });
        }
        catch (err) {
            console.error(`Error changing comment count: ${err.message}`);
        }
        /* Flag unread and tickle activity for message creator */
        const notifyId = (yield shared.getMessage(channelId, messageId)).val().created_by;
        if (notifyId === comment.created_by) {
            return;
        } // Don't notify if self commenting.
        try {
            const updates = {};
            updates[`unreads/${notifyId}/${channelId}/${messageId}`] = commentId;
            updates[`channel-members/${channelId}/${notifyId}/activity_at`] = comment.created_at;
            updates[`channel-members/${channelId}/${notifyId}/activity_at_desc`] = comment.created_at_desc;
            updates[`channel-members/${channelId}/${notifyId}/activity_by`] = comment.created_by;
            yield shared.database.ref().update(updates);
        }
        catch (err) {
            console.error('Error updating unreads and sort priority: ', err);
            return;
        }
        /* Notify */
        try {
            /* Gather installs */
            const installs = [];
            const promises = [];
            promises.push(notifications.gatherInstalls(notifyId, installs));
            yield Promise.all(promises);
            if (installs.length === 0) {
                return;
            }
            const channelName = (yield shared.getChannel(channelId)).val().name;
            const user = (yield shared.getUser(notifyId)).val();
            const username = user.username;
            const language = user.profile.language ? user.profile.language : 'en';
            const data = {
                user_id: comment.created_by,
                channel_id: channelId,
                message_id: messageId,
            };
            if (language === 'en') {
                const notificationText = `#${channelName} @${username}: commented on a post: ${comment.text}`;
                yield notifications.sendMessages(installs, notificationText, data);
            }
            else if (language === 'ru') {
                const notificationText = `#${channelName} @${username}: прокомментировал сообщение: ${comment.text}`;
                yield notifications.sendMessages(installs, notificationText, data);
            }
        }
        catch (err) {
            console.error('Error processing new comment notifications: ', err);
            return;
        }
    });
}
//# sourceMappingURL=comments.js.map