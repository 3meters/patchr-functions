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
const shared = require("./shared");
function onWriteReaction(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield log(context.params, data);
    });
}
exports.onWriteReaction = onWriteReaction;
function log(params, snapshot) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('snapshot', snapshot);
        /* Gather channel members */
        const channelId = params.channelId;
        const messageId = params.messageId;
        const reaction = snapshot.val(); // userId:true
        const reactionId = params.reactionId; // :grinning:
        let userId;
        for (const key in reaction) {
            if (reaction.hasOwnProperty(key)) {
                userId = key;
            }
        }
        const user = (yield shared.getUser(userId)).val();
        const username = user.username;
        const channelName = (yield shared.getChannel(channelId)).val().name;
        const timestamp = Date.now();
        const timestampReversed = timestamp * -1;
        const memberIds = yield shared.getMemberIds(channelId);
        /* Activity */
        try {
            const activity = {
                archived: false,
                channel_id: channelId,
                message_id: messageId,
                created_at: timestamp,
                created_at_desc: timestampReversed,
                modified_at: timestamp,
                text: `#${channelName} @${username}: reacted to message with ${reactionId}.`,
            };
            for (const memberId of memberIds) {
                yield shared.database.ref().child(`activity/${memberId}`).push().set(activity);
            }
        }
        catch (err) {
            console.error('Error creating activity: ', err);
            return;
        }
    });
}
//# sourceMappingURL=reactions.js.map