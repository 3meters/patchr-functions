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
 * Group member processing
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
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.params, event.data.previous);
        }
        else if (shared.getAction(event) === Action.change) {
            yield changed(event.params, event.data.previous, event.data.current);
        }
    });
}
exports.onWriteMember = onWriteMember;
function created(params, current) {
    return __awaiter(this, void 0, void 0, function* () {
        /* Validation means membership passed all requirements (group exists, invite or by owner)
          Add to member-groups
          Add to group default channels if not guest */
        const membership = current.val();
        const timestamp = Date.now();
        console.log(`User: ${params.userId} added to group: ${params.groupId}`);
        try {
            const updates = {};
            updates[`member-groups/${params.userId}/${params.groupId}`] = membership;
            if (membership.role !== 'guest') {
                const defaults = (yield shared.database.ref(`groups/${params.groupId}/default_channels`).once('value')).val();
                const channelMembership = shared.channelMemberMap(params.userId, timestamp, 4, 'member');
                defaults.forEach((channelId) => {
                    updates[`group-channel-members/${params.groupId}/${channelId}/${params.userId}/`] = channelMembership;
                });
            }
            if (membership.invite_id) {
                const path = `invites/${params.groupId}/${membership.invited_by}/${membership.invite_id}`;
                updates[`${path}/accepted_at`] = timestamp;
                updates[`${path}/accepted_by`] = params.userId;
                updates[`${path}/status`] = 'accepted'; // Can still be used again
            }
            /* Commit all the required updates */
            yield shared.database.ref().update(updates);
        }
        catch (err) {
            console.error('Error adding group member: ', err);
            return;
        }
    });
}
function changed(params, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const membership = current.val();
        console.log(`Group member updated: ${params.userId}`);
        try {
            yield shared.database.ref(`member-groups/${params.userId}/${params.groupId}`).set(membership);
        }
        catch (err) {
            console.error('Error updating group member: ', err);
            return;
        }
    });
}
function deleted(params, previous) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Member: ${params.userId} removed from group: ${params.groupId}`);
        const updates = {};
        updates[`member-groups/${params.userId}/${params.groupId}`] = null; // No trigger
        updates[`member-channels/${params.userId}/${params.groupId}`] = null; // No trigger 
        updates[`invites/${params.groupId}/${params.userId}`] = null; // No trigger
        updates[`unreads/${params.userId}/${params.groupId}`] = null; // No trigger
        try {
            /* Remove the user from all their channel memberships */
            const channelIds = yield shared.getMemberChannelIds(params.userId, params.groupId);
            if (channelIds.length > 0) {
                channelIds.forEach((channelId) => {
                    /* Has delete trigger that also removes from member-channels
                      and unreads (has delete trigger) */
                    updates[`group-channel-members/${params.groupId}/${channelId}/${params.userId}`] = null;
                });
            }
            yield shared.database.ref().update(updates);
        }
        catch (err) {
            console.error('Error removing group member: ', err);
            return;
        }
    });
}
//# sourceMappingURL=group-members.js.map