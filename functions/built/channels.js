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
function onWriteChannel(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(data) === Action.create) {
            yield created(data.after);
            yield log(Action.create, context.params, data);
        }
        else if (shared.getAction(data) === Action.change) {
            yield updated(data.before, data.after);
            yield log(Action.change, context.params, data);
        }
        else if (shared.getAction(data) === Action.delete) {
            yield deleted(data.before);
            yield log(Action.delete, context.params, data);
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
function updated(before, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = current.key;
        const photoBefore = before.val().photo;
        const photoAfter = current.val().photo;
        if (current.child('title') !== before.child('title')) {
            const slug = shared.slugify(current.val().title); // converts all intl chars to url legal chars
            const updates = {};
            updates[`channels/${channelId}/name`] = slug.toLowerCase();
            yield shared.database.ref().update(updates);
        }
        if (photoBefore) {
            if (!photoAfter || photoBefore.filename !== photoAfter.filename) {
                if (photoBefore.source === 'google-storage') {
                    console.log(`Deleting image file: ${photoBefore.filename}`);
                    yield shared.deleteImageFile(photoBefore.filename);
                }
            }
        }
    });
}
function deleted(before) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelId = before.key;
        const photo = before.val().photo;
        const updates = {};
        channelName = before.val().name;
        console.log(`Channel deleted: ${channelId}`, before.val().name);
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
        if (snapshot.after.exists()) {
            userId = snapshot.after.val().owned_by;
        }
        else if (snapshot.before.exists()) {
            userId = snapshot.before.val().owned_by;
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
                const previousPhoto = snapshot.before.val().photo;
                const currentPhoto = snapshot.after.val().photo;
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
                memberIds = [snapshot.before.val().owned_by];
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