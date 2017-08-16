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
            yield updated(event.data.previous, event.data.current);
        }
    });
}
exports.onWriteChannel = onWriteChannel;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = current.key;
        console.log(`Channel created: ${channelId}`);
        const userId = current.val().created_by;
        const timestamp = Date.now();
        const slug = shared.slugify(current.val().title);
        const code = current.val().code;
        const membership = shared.channelMemberMap(userId, timestamp, 'owner', code);
        const updates = {};
        updates[`channels/${channelId}/name`] = slug;
        updates[`channel-members/${channelId}/${userId}/`] = membership;
        /* Submit updates */
        yield shared.database.ref().update(updates);
    });
}
function updated(previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = current.key;
        const previousPhoto = previous.val().photo;
        const currentPhoto = current.val().photo;
        console.log(`Channel updated: ${channelId}`);
        if (current.child('title').changed()) {
            const slug = shared.slugify(current.val().title);
            const updates = {};
            updates[`channels/${channelId}/name`] = slug;
            yield shared.database.ref().update(updates);
        }
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
        const photo = previous.val().photo;
        const updates = {};
        console.log(`Channel deleted: ${channelId}`);
        updates[`channel-messages/${channelId}`] = null;
        updates[`channel-members/${channelId}`] = null;
        /* Gather list of channel members */
        const memberIds = yield shared.getMemberIds(channelId);
        if (memberIds.length !== 0) {
            memberIds.forEach((memberId) => {
                updates[`member-channels/${memberId}/${channelId}`] = null;
                updates[`unreads/${memberId}/${channelId}`] = null;
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