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
        const commentId = current.key;
        const channelId = current.val().channel_id;
        const messageId = current.val().message_id;
        const createdBy = current.val().created_by;
        console.log(`Comment created: ${commentId} for: ${messageId} channel: ${channelId}`);
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
        /* Mark message as unread for message creator */
        const messageCreatedBy = (yield shared.getMessage(channelId, messageId)).val().created_by;
        if (messageCreatedBy === createdBy) {
            return;
        } // Don't notify if self commenting.
        const updates = {};
        updates[`unreads/${messageCreatedBy}/${channelId}/${messageId}`] = commentId;
        yield shared.database.ref().update(updates);
    });
}
//# sourceMappingURL=comments.js.map