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
const utils = require("./utils");
const Action = shared.Action;
const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1];
/* Two extra invokes: task updated with response, task deleted by client. */
function onWriteGroup(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(event) === Action.create) {
            yield created(event.data.current);
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.data.previous);
        }
        else if (shared.getAction(event) === Action.change) {
            yield changed(event.data.previous, event.data.current);
        }
    });
}
exports.onWriteGroup = onWriteGroup;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const groupId = current.key;
        const userId = current.val().created_by;
        const timestamp = Date.now();
        console.log(`Group created: ${groupId}`);
        /* Add creator as group owner */
        const user = yield shared.auth.getUser(userId);
        const groupMembership = shared.groupMemberMap(userId, timestamp, 4, 'owner', user.email);
        const updates = {};
        updates[`group-members/${groupId}/${userId}/`] = groupMembership;
        /* Add default general channel */
        const generalId = `ch-${utils.generateRandomId()}`;
        const general = {
            archived: false,
            created_at: timestamp,
            created_by: userId,
            general: true,
            group_id: groupId,
            name: 'general',
            owned_by: userId,
            purpose: 'This channel is for messaging and announcements to the whole group. All group members are in this channel.',
            type: 'channel',
            visibility: 'open',
        };
        updates[`group-channels/${groupId}/${generalId}`] = general;
        /* Add default chatter channel */
        const chatterId = `ch-${utils.generateRandomId()}`;
        const chatter = {
            archived: false,
            created_at: timestamp,
            created_by: userId,
            general: true,
            group_id: groupId,
            name: 'chatter',
            owned_by: userId,
            purpose: 'The perfect place for crazy talk that you\'d prefer to keep off the other channels.',
            type: 'channel',
            visibility: 'open',
        };
        updates[`group-channels/${groupId}/${chatterId}`] = chatter;
        updates[`groups/${groupId}/default_channels`] = [generalId, chatterId];
        /* Submit updates */
        yield shared.database.ref().update(updates);
    });
}
function changed(previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = current.key;
        const previousPhoto = previous.val().photo;
        const currentPhoto = current.val().photo;
        console.log(`Channel changed: ${channelId}`);
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
        const groupId = previous.key;
        const photo = previous.val().photo;
        const updates = {};
        console.log(`Group deleted: ${groupId}`);
        updates[`group-channels/${groupId}`] = null; // No trigger
        updates[`invites/${groupId}`] = null; // No trigger
        updates[`groups/${groupId}`] = null; // No trigger
        updates[`group-members/${groupId}`] = null; // No trigger
        updates[`channel-names/${groupId}`] = null; // No trigger
        /* Gather list of group members */
        const memberIds = yield shared.getMemberIds(groupId, null);
        if (memberIds.length !== 0) {
            memberIds.forEach((memberId) => {
                updates[`member-groups/${memberId}/${groupId}`] = null; // No trigger
                updates[`unreads/${memberId}/${groupId}`] = null; // No trigger
                updates[`member-channels/${memberId}/${groupId}`] = null; // No trigger
            });
        }
        /* Submit updates */
        yield shared.database.ref().update(updates);
        /* Delete image file if needed */
        if (photo) {
            if (photo.source === 'google-storage') {
                console.log(`Deleting image file: ${photo.filename}`);
                yield shared.deleteImageFile(photo.filename);
            }
        }
    });
}
//# sourceMappingURL=groups.js.map