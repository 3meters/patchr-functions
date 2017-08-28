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
const _ = require("lodash");
admin.initializeApp({
    databaseURL: 'https://patchr-ios-dev.firebaseio.com',
    credential: admin.credential.cert('service-credentials-dev.json'),
    databaseAuthVariableOverride: {
        uid: 'patchr-cloud-worker',
    },
});
const codes = {};
const root = {};
run();
/* jshint -W098 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Photo fixup running...');
        yield fixupChannels();
    });
}
function fixupChannels() {
    return __awaiter(this, void 0, void 0, function* () {
        const channels = (yield admin.database().ref('channels').once('value')).val();
        _.forOwn(channels, (channel, channelId) => __awaiter(this, void 0, void 0, function* () {
            if (channel.general) {
                const user = (yield getUser(channel.owned_by)).val();
                const title = `${user.username} channel`;
                const name = `${user.username}-channel`;
                console.log(`general: old: ${channel.name} new: ${name} id: ${channelId}`);
                const updates = {};
                updates[`channels/${channelId}/title`] = title;
                yield admin.database().ref().update(updates);
            }
            else if (channel.name === 'chatter') {
                console.log(`chatter: ${channel.name} id: ${channelId}`);
                yield admin.database().ref(`channels/${channelId}`).remove();
            }
            else {
                console.log(`custom: ${channel.name} id: ${channelId}`);
            }
        }));
    });
}
function getUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const value = yield admin.database()
            .ref(`users/${userId}`)
            .once('value');
        return value;
    });
}
//# sourceMappingURL=fixup_channels.js.map