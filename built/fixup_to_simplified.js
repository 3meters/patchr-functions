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
const admin = require("firebase-admin");
admin.initializeApp({
    databaseURL: 'https://patchr-ios-dev.firebaseio.com',
    credential: admin.credential.cert('service-credentials-dev.json'),
    databaseAuthVariableOverride: {
        uid: 'patchr-cloud-worker',
    },
});
// tslint:disable-next-line:no-var-requires
const gcs = require('@google-cloud/storage')({
    projectId: 'patchr-ios-dev',
    keyFilename: 'service-credentials-dev.json',
});
run();
/* jshint -W098 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Export transform running...');
        yield transformUnreads();
    });
}
function transformUnreads() {
    return __awaiter(this, void 0, void 0, function* () {
        const unreads = yield admin.database().ref('unreads').once('value');
        unreads.forEach((user) => {
            const userId = user.key;
            user.forEach((group) => {
                group.forEach((channel) => {
                    const channelId = channel.key;
                    if (userId && channelId) {
                        admin.database().ref(`unreads-v2/${userId}/${channelId}`).set(channel.val());
                    }
                    return false;
                });
                return false;
            });
            return false;
        });
    });
}
function fixupMessagePhotos() {
    return __awaiter(this, void 0, void 0, function* () {
        const groups = yield admin.database()
            .ref('group-messages')
            .once('value');
        let count = 0;
        groups.forEach((group) => {
            group.forEach((channel) => {
                channel.forEach((message) => {
                    if (message.val().attachments) {
                        for (const prop in message.val().attachments) {
                            if (message.val().attachments.hasOwnProperty(prop)) {
                                const photo = message.val().attachments[prop].photo;
                                if (photo.source === 'aircandi.images') {
                                    count++;
                                    const path = `attachments/${prop}/photo/source`;
                                    console.log(`Updating photo source: ${photo.filename}`);
                                    console.log(`Path: ${message.ref}/${path}`);
                                    // message.ref.child(path).set('google-storage')
                                }
                            }
                        }
                    }
                    return false;
                });
                return false;
            });
            return false;
        });
        console.log(`Total images: ${count}`);
    });
}
function fixupUserPhotos() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield admin.database()
            .ref('users')
            .once('value');
        let count = 0;
        users.forEach((user) => {
            if (user.val().profile && user.val().profile.photo) {
                const photo = user.val().profile.photo;
                if (photo.source === 'aircandi.images') {
                    count++;
                    const path = `profile/photo/source`;
                    console.log(`Updating photo source: ${photo.filename}`);
                    console.log(`Path: ${user.ref}/${path}`);
                    user.ref.child(path).set('google-storage');
                }
            }
            return false;
        });
        console.log(`Total images: ${count}`);
    });
}
function fixupGroupPhotos() {
    return __awaiter(this, void 0, void 0, function* () {
        const groups = yield admin.database()
            .ref('groups')
            .once('value');
        let count = 0;
        groups.forEach((group) => {
            if (group.val().photo) {
                const photo = group.val().photo;
                if (photo.source === 'aircandi.images') {
                    count++;
                    const path = `photo/source`;
                    console.log(`Updating photo source: ${photo.filename}`);
                    console.log(`Path: ${group.ref}/${path}`);
                    group.ref.child(path).set('google-storage');
                }
            }
            return false;
        });
        console.log(`Total images: ${count}`);
    });
}
function fixupChannelPhotos() {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = gcs.bucket('patchr-images');
        const groups = yield admin.database()
            .ref('group-channels')
            .once('value');
        let count = 0;
        groups.forEach((group) => {
            group.forEach((channel) => {
                if (channel.val().photo) {
                    const photo = channel.val().photo;
                    if (photo.source === 'aircandi.images') {
                        count++;
                        const path = `photo/source`;
                        console.log(`Updating photo source: ${photo.filename}`);
                        console.log(`Path: ${channel.ref}/${path}`);
                        // channel.ref.child(path).set('google-storage')
                    }
                    else {
                        bucket.file(photo.filename).exists().then((data) => {
                            const exists = data[0];
                            if (!exists) {
                                console.log(`Clear broken photo: ${photo.filename}`);
                                // channel.ref.child('photo').remove()
                            }
                        });
                    }
                }
                return false;
            });
            return false;
        });
        console.log(`Total images: ${count}`);
    });
}
//# sourceMappingURL=fixup_to_simplified.js.map