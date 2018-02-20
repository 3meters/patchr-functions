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
const fs = require("fs");
const _ = require("lodash");
// admin.initializeApp({
//   databaseURL: 'https://patchr-ios-dev.firebaseio.com',
//   credential: admin.credential.cert('service-credentials-dev.json'),
//   databaseAuthVariableOverride: {
//     uid: 'patchr-cloud-worker',
//   },
// })
admin.initializeApp({
    databaseURL: 'https://patchr-ios.firebaseio.com',
    credential: admin.credential.cert('service-credentials-prod.json'),
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
        console.log('Export transform running...');
        yield copy();
        yield transformMessages();
        const stream = fs.createWriteStream('patchr_database.json');
        stream.write(JSON.stringify(root, null, 2));
        console.log('Database file saved');
    });
}
function copy() {
    return __awaiter(this, void 0, void 0, function* () {
        const channelMembers = (yield admin.database().ref('channel-members').once('value')).val();
        const channelMessages = (yield admin.database().ref('channel-messages').once('value')).val();
        const channels = (yield admin.database().ref('channels').once('value')).val();
        const clients = (yield admin.database().ref('clients').once('value')).val();
        const counters = (yield admin.database().ref('counters').once('value')).val();
        const installs = (yield admin.database().ref('installs').once('value')).val();
        const memberChannels = (yield admin.database().ref('member-channels').once('value')).val();
        const messageComments = (yield admin.database().ref('message-comments').once('value')).val();
        const unreads = (yield admin.database().ref('unreads').once('value')).val();
        const usernames = (yield admin.database().ref('usernames').once('value')).val();
        const users = (yield admin.database().ref('users').once('value')).val();
        root['channel-members'] = channelMembers;
        root['channel-messages'] = channelMessages;
        root['channels'] = channels;
        root['clients'] = clients;
        root['counters'] = counters;
        root['installs'] = installs;
        root['member-channels'] = memberChannels;
        root['message-comments'] = messageComments;
        root['unreads'] = unreads;
        root['usernames'] = usernames;
        root['users'] = users;
    });
}
function transformMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        const channels = (yield admin.database().ref('message-comments').once('value')).val();
        console.log('comments:', channels);
        _.forOwn(channels, (channel, channelId) => {
            _.forOwn(channel, (message, messageId) => {
                console.log(`channelId: ${channelId}, messageId: ${messageId}`);
                root['channel-messages'][channelId][messageId]['comments'] = message;
            });
        });
    });
}
function titleize(slug) {
    const words = slug.split('-');
    return words.map((word) => {
        return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
}
function generateRandomId(digits) {
    // No dupes in 100 runs of one million if using 9
    const charSet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charSetSize = charSet.length;
    let id = '';
    for (let i = 1; i <= digits; i++) {
        const randPos = Math.floor(Math.random() * charSetSize);
        id += charSet[randPos];
    }
    return id;
}
//# sourceMappingURL=fixup_comments.js.map