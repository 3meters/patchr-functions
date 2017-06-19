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
const Action = shared.Action;
function onWriteChannel(event) {
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
exports.onWriteChannel = onWriteChannel;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = current.key;
        const groupId = current.val().group_id;
        const userId = current.val().created_by;
        const timestamp = Date.now();
        const channelMembership = shared.channelMemberMap(userId, timestamp, 4, 'owner');
        const updates = {};
        console.log(`Channel created: ${channelId} for group: ${groupId}`);
        updates[`channel-names/${groupId}/${current.val().name}`] = channelId;
        updates[`group-channel-members/${groupId}/${channelId}/${userId}/`] = channelMembership;
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
        const channelId = previous.key;
        const groupId = previous.val().group_id;
        const photo = previous.val().photo;
        const updates = {};
        console.log(`Channel deleted: ${channelId} from group: ${groupId}`);
        updates[`group-messages/${groupId}/${channelId}`] = null;
        updates[`channel-names/${groupId}/${previous.val().name}`] = null;
        updates[`group-channel-members/${groupId}/${channelId}`] = null;
        /* Remove from group defaults if needed */
        const defaults = (yield shared.database.ref(`groups/${groupId}/default_channels`).once('value')).val();
        if (defaults) {
            const newDefaults = defaults.filter((defaultChannelId) => {
                return (defaultChannelId !== channelId);
            });
            if (defaults.length !== newDefaults.length) {
                updates[`groups/${groupId}/default_channels`] = newDefaults;
            }
        }
        /* Gather list of channel members */
        const memberIds = yield shared.getMemberIds(groupId, channelId);
        if (memberIds.length !== 0) {
            memberIds.forEach((memberId) => {
                updates[`member-channels/${memberId}/${groupId}/${channelId}`] = null;
                updates[`unreads/${memberId}/${groupId}/${channelId}`] = null;
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
//# sourceMappingURL=channels.js.map