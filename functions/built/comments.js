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
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.data.previous);
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
        const createdBy = comment.created_by;
        console.log(`Comment created: ${commentId} for: ${messageId}`);
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
        /* Notify message creator */
        const messageCreatedBy = (yield shared.getMessage(channelId, messageId)).val().created_by;
        if (messageCreatedBy === createdBy) {
            return;
        } // Don't notify if self commenting.
        const notifyIds = [messageCreatedBy];
        const username = (yield shared.getUser(createdBy)).val().username;
        const channelName = (yield shared.getChannel(channelId)).val().name;
        const data = {
            user_id: createdBy,
            channel_id: channelId,
            message_id: messageId,
            comment_id: commentId,
        };
        const notificationText = `#${channelName} @${username}: commented on your message: ${comment.text}`;
        try {
            const installs = [];
            const promises = [];
            const updates = {};
            for (const notifyId of notifyIds) {
                promises.push(notify(notifyId, installs));
            }
            yield Promise.all(promises);
            if (installs.length > 0) {
                yield notifications.sendMessages(installs, notificationText, data);
            }
        }
        catch (err) {
            console.error('Error sending notifications: ', err);
            return;
        }
        function notify(memberId, installs) {
            return __awaiter(this, void 0, void 0, function* () {
                const snaps = yield shared.database.ref(`installs/${memberId}`).once('value');
                snaps.forEach((install) => {
                    if (install.key) {
                        installs.push({ id: install.key, userId: memberId });
                    }
                    return false;
                });
            });
        }
    });
}
function deleted(previous) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = previous.val().channel_id;
        const messageId = previous.val().message_id;
        const commentId = previous.key;
        console.log(`Comment deleted: ${commentId} for: ${messageId}`);
        try {
            const countRef = shared.database.ref(`/channel-messages/${channelId}/${messageId}/comment_count`);
            yield countRef.transaction((current) => {
                return (current || 0) - 1;
            });
        }
        catch (err) {
            console.error(`Error changing comment count: ${err.message}`);
        }
    });
}
//# sourceMappingURL=comments.js.map