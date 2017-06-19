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
function onWriteProfile(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.params) {
            return;
        }
        if (shared.getAction(event) === Action.delete) {
            yield deletedProfile(event.params.userId, event.data.previous);
        }
        else if (shared.getAction(event) === Action.change) {
            yield changedProfile(event.params.userId, event.data.previous, event.data.current);
        }
    });
}
exports.onWriteProfile = onWriteProfile;
function onWriteUsername(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.params) {
            return;
        }
        if (shared.getAction(event) === Action.create) {
            yield createdUsername(event.params.userId, event.data.current);
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deletedUsername(event.params.userId, event.data.previous);
        }
        else if (shared.getAction(event) === Action.change) {
            yield changedUsername(event.params.userId, event.data.previous, event.data.current);
        }
    });
}
exports.onWriteUsername = onWriteUsername;
function createUser(task) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = task.request;
        const user = {
            created_at: admin.database.ServerValue.TIMESTAMP,
            created_by: task.created_by,
            modified_at: admin.database.ServerValue.TIMESTAMP,
            username: req.username,
        };
        console.log(`Creating user: ${req.user_id}`);
        try {
            yield shared.database.ref(`users/${req.user_id}`).set(user); // Validation will catch duplicate username
            if (task.adminRef) {
                yield task.adminRef.child('response').set({ result: 'ok' });
            }
        }
        catch (err) {
            console.error(`Error creating user: ${err}`);
            if (task.adminRef) {
                yield task.adminRef.child('response').set({ error: `Error creating user: ${err.message}` });
            }
        }
    });
}
exports.createUser = createUser;
/* Profile */
function changedProfile(userId, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Profile changed: ${userId}`);
        /* Delete previous image file if needed */
        if (current.child('profile/photo/filename').changed()) {
            const previousPhoto = previous.val().photo;
            if (previousPhoto && previousPhoto.source === 'google-storage') {
                console.log(`Deleting image file: ${previousPhoto.filename}`);
                yield shared.deleteImageFile(previousPhoto.filename);
            }
        }
    });
}
function deletedProfile(userId, previous) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Profile deleted: ${userId}`);
        /* Delete image file if needed */
        const photo = previous.val().photo;
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
        console.log(`Claiming username: ${current.val()}`);
        updates[`usernames/${current.val()}`] = null;
        yield shared.database.ref().update(updates);
    });
}
function changedUsername(userId, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        /* Release old username and claim new one */
        const previousUsername = previous.val();
        const currentUsername = current.val();
        console.log(`User ${userId} changed username: ${previousUsername} to: ${currentUsername}`);
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