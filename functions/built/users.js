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
 * User processing
 */
const shared = require("./shared");
const Action = shared.Action;
function onUpdateProfile(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!context.params) {
            return;
        }
        yield updatedProfile(context.params.userId, data.before, data.after);
    });
}
exports.onUpdateProfile = onUpdateProfile;
function onDeleteProfile(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!context.params) {
            return;
        }
        yield deletedProfile(context.params.userId, data);
    });
}
exports.onDeleteProfile = onDeleteProfile;
function onWriteUsername(data, context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!context.params) {
            return;
        }
        if (shared.getAction(data) === Action.create) {
            yield createdUsername(context.params.userId, data.after);
        }
        else if (shared.getAction(data) === Action.delete) {
            yield deletedUsername(context.params.userId, data.before);
        }
        else if (shared.getAction(data) === Action.change) {
            yield updatedUsername(context.params.userId, data.before, data.after);
        }
    });
}
exports.onWriteUsername = onWriteUsername;
/* Profile */
function updatedProfile(userId, before, after) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Profile updated: ${userId}`);
        /* Delete previous image file if needed */
        const photoBefore = before.val().photo;
        const photoAfter = after.val().photo;
        if (photoBefore) {
            if (!photoAfter || photoAfter.filename !== photoBefore.filename) {
                if (photoBefore.source === 'google-storage') {
                    console.log(`Deleting image file: ${photoBefore.filename}`);
                    yield shared.deleteImageFile(photoBefore.filename);
                }
            }
        }
    });
}
function deletedProfile(userId, before) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Profile deleted: ${userId}`);
        /* Delete image file if needed */
        const photo = before.val().photo;
        if (photo && photo.source === 'google-storage') {
            console.log(`Deleting image file: ${photo.filename}`);
            yield shared.deleteImageFile(photo.filename);
        }
    });
}
/* Username */
function createdUsername(userId, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const updates = {};
        const username = current.val();
        console.log(`Claiming username: ${username}`);
        updates[`usernames/${username}`] = userId;
        yield shared.database.ref().update(updates);
    });
}
function updatedUsername(userId, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        /* Release old username and claim new one */
        const previousUsername = previous.val();
        const currentUsername = current.val();
        console.log(`User ${userId} updated username: ${previousUsername} to: ${currentUsername}`);
        const update = {};
        update[`usernames/${previousUsername}`] = null;
        update[`usernames/${currentUsername}`] = userId;
        yield shared.database.ref().update(update);
    });
}
function deletedUsername(userId, previous) {
    return __awaiter(this, void 0, void 0, function* () {
        const updates = {};
        console.log(`Releasing username: ${previous.val()}`);
        updates[`usernames/${previous.val()}`] = null;
        yield shared.database.ref().update(updates);
    });
}
//# sourceMappingURL=users.js.map