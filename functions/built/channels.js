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
let memberIds;
let channelName;
function onWriteChannel(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(event) === Action.create) {
            yield created(event.data.current);
            yield log(Action.create, event.params, event.data);
        }
        else if (shared.getAction(event) === Action.change) {
            yield updated(event.data.previous, event.data.current);
            yield log(Action.change, event.params, event.data);
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.data.previous);
            yield log(Action.delete, event.params, event.data);
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
        if (current.child('title').changed()) {
            const slug = shared.slugify(current.val().title); // converts all intl chars to url legal chars
            const updates = {};
            updates[`channels/${channelId}/name`] = slug.toLowerCase();
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
        channelName = previous.val().name;
        console.log(`Channel deleted: ${channelId}`, previous.val().name);
        /* Gather list of channel members */
        memberIds = yield shared.getMemberIds(channelId);
        for (const memberId of memberIds) {
            updates[`member-channels/${memberId}/${channelId}`] = null;
            updates[`unreads/${memberId}/${channelId}`] = null;
        }
        updates[`channel-messages/${channelId}`] = null;
        updates[`channel-members/${channelId}`] = null;
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
function log(action, params, snapshot) {
    return __awaiter(this, void 0, void 0, function* () {
        /* Gather channel members */
        const channelId = params.channelId;
        let userId = '';
        if (snapshot.exists()) {
            userId = snapshot.val().owned_by;
        }
        else if (snapshot.previous.exists()) {
            userId = snapshot.previous.val().owned_by;
        }
        if (!memberIds) {
            memberIds = yield shared.getMemberIds(channelId);
            if (memberIds.length === 0) {
                return;
            }
        }
        /* Activity */
        try {
            if (!channelName) {
                channelName = (yield shared.getChannel(channelId)).val().name;
            }
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
                activity.text = `#${channelName} @${username}: created scrapbook.`;
            }
            else if (action === Action.change) {
                const previousPhoto = snapshot.previous.val().photo;
                const currentPhoto = snapshot.val().photo;
                if (previousPhoto) {
                    if (!currentPhoto || previousPhoto.filename !== currentPhoto.filename) {
                        activity.text = `#${channelName} @${username}: changed cover photo.`;
                    }
                }
                else if (currentPhoto) {
                    activity.text = `#${channelName} @${username}: added cover photo.`;
                }
            }
            else if (action === Action.delete) {
                memberIds = [snapshot.previous.val().owned_by];
                activity.text = `#${channelName} @${username}: deleted scrapbook.`;
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
//# sourceMappingURL=channels.js.map