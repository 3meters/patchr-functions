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
 * Channel member processing
 */
const shared = require("./shared");
const Action = shared.Action;
function onWriteMember(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.params) {
            return;
        }
        if (shared.getAction(event) === Action.create) {
            yield created(event.params, event.data.current);
            yield log(Action.create, event.params, event.data.previous, event.data.current);
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.params, event.data.previous);
            yield log(Action.delete, event.params, event.data.previous, event.data.current);
        }
        else if (shared.getAction(event) === Action.change) {
            yield updated(event.params, event.data.previous, event.data.current);
            yield log(Action.change, event.params, event.data.previous, event.data.current);
        }
    });
}
exports.onWriteMember = onWriteMember;
function created(params, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const membership = current.val();
        console.log(`Member: ${params.userId} added to channel: ${params.channelId}`);
        try {
            yield shared.database.ref(`member-channels/${params.userId}/${params.channelId}`).set(membership);
        }
        catch (err) {
            console.error('Error adding channel member: ', err);
            return;
        }
    });
}
function updated(params, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const membership = current.val();
        try {
            yield shared.database.ref(`member-channels/${params.userId}/${params.channelId}`).set(membership);
        }
        catch (err) {
            console.error('Error updating channel member: ', err);
            return;
        }
    });
}
function deleted(params, previous) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Member: ${params.userId} removed from channel: ${params.channelId}`);
        const updates = {};
        updates[`member-channels/${params.userId}/${params.channelId}`] = null; // No trigger
        updates[`unreads/${params.userId}/${params.channelId}`] = null; // Delete trigger that updates counter
        try {
            yield shared.database.ref().update(updates);
        }
        catch (err) {
            console.error('Error removing channel member: ', err);
            return;
        }
    });
}
function log(action, params, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        /* Gather channel members */
        const channelId = params.channelId;
        const userId = params.userId;
        const memberIds = yield shared.getMemberIds(channelId);
        if (memberIds.length === 0) {
            return;
        }
        /* Activity */
        try {
            const channelName = (yield shared.getChannel(channelId)).val().name;
            const user = (yield shared.getUser(userId)).val();
            const username = user.username;
            const timestamp = Date.now();
            const timestampReversed = timestamp * -1;
            const activity = {
                archived: false,
                channel_id: channelId,
                created_at: timestamp,
                created_at_desc: timestampReversed,
                modified_at: timestamp,
                text: 'empty',
            };
            if (action === Action.create) {
                const membership = current.val();
                activity.text = `#${channelName} @${username}: joined as ${membership.role}.`;
            }
            else if (action === Action.change) {
                const membershipCur = current.val();
                const membershipPrev = previous.val();
                if (membershipCur.role !== membershipPrev.role) {
                    activity.text = `#${channelName} @${username}: assigned as ${membershipCur.role}.`;
                }
            }
            else if (action === Action.delete) {
                activity.text = `#${channelName} @${username}: left the scrapbook.`;
            }
            if (activity.text !== 'empty') {
                for (const memberId of memberIds) {
                    yield shared.database.ref().child(`activity/${memberId}`).push().set(activity);
                }
            }
        }
        catch (err) {
            console.error('Error creating activity: ', err);
            return;
        }
    });
}
//# sourceMappingURL=channel-members.js.map