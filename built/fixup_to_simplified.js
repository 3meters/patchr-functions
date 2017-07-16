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
admin.initializeApp({
    databaseURL: 'https://patchr-ios-dev.firebaseio.com',
    credential: admin.credential.cert('service-credentials-dev.json'),
    databaseAuthVariableOverride: {
        uid: 'patchr-cloud-worker',
    },
});
const root = {};
run();
/* jshint -W098 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        /*
          channel-names: exclude
          clients: no change
          counters: exclude
          group-channel-members: ** transform **
          group-channels: ** transform **
          group-members: exclude
          group-messages: ** transform **
          groups: exclude
          installs: no change
          member-channels: created as part of group-channel-members
          member-groups: exclude
          typing: exclude
          unreads: exclude
          usernames: no change
          users: no change
        */
        console.log('Export transform running...');
        yield transformChannels();
        yield transformMembership();
        yield transformMessages();
        yield copy();
        const stream = fs.createWriteStream('database.json');
        stream.write(JSON.stringify(root, null, 2));
        console.log('Database file saved');
    });
}
function copy() {
    return __awaiter(this, void 0, void 0, function* () {
        const clients = (yield admin.database().ref('clients').once('value')).val();
        const installs = (yield admin.database().ref('installs').once('value')).val();
        const usernames = (yield admin.database().ref('usernames').once('value')).val();
        const users = (yield admin.database().ref('users').once('value')).val();
        root['clients'] = clients;
        root['installs'] = installs;
        root['usernames'] = usernames;
        root['users'] = users;
    });
}
function transformChannels() {
    return __awaiter(this, void 0, void 0, function* () {
        root['channels'] = {};
        const groups = (yield admin.database().ref('group-channels').once('value')).val();
        _.forOwn(groups, (group, groupId) => {
            _.forOwn(group, (channel, channelId) => {
                delete channel.group_id;
                delete channel.archived;
                delete channel.type;
                delete channel.visibility;
                delete channel.topic;
                if (channel.general || channel.name === 'chatter') {
                    delete channel.purpose;
                }
                channel.title = titleize(channel.name);
                root['channels'][channelId] = channel;
            });
        });
    });
}
function transformMembership() {
    return __awaiter(this, void 0, void 0, function* () {
        root['channel-members'] = {};
        root['member-channels'] = {};
        const groups = (yield admin.database().ref('group-channel-members').once('value')).val();
        _.forOwn(groups, (group, groupId) => {
            _.forOwn(group, (channel, channelId) => {
                _.forOwn(channel, (membership, userId) => {
                    membership.notifications = 'all';
                    if (membership.muted) {
                        membership.notifications = 'none';
                    }
                    if (membership.role === 'member') {
                        membership.role = 'editor';
                    }
                    else if (membership.role === 'visitor') {
                        membership.role = 'reader';
                    }
                    if (!root['channel-members'][channelId]) {
                        root['channel-members'][channelId] = {};
                    }
                    if (!root['member-channels'][userId]) {
                        root['member-channels'][userId] = {};
                    }
                    delete membership.archived;
                    delete membership.muted;
                    root['channel-members'][channelId][userId] = membership;
                    root['member-channels'][userId][channelId] = membership;
                });
            });
        });
    });
}
function transformMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        root['channel-messages'] = {};
        const groups = (yield admin.database().ref('group-messages').once('value')).val();
        _.forOwn(groups, (group, groupId) => {
            _.forOwn(group, (channel, channelId) => {
                _.forOwn(channel, (message, messageId) => {
                    if (!root['channel-messages'][channelId]) {
                        root['channel-messages'][channelId] = {};
                    }
                    delete message.group_id;
                    if (message.source !== 'system') {
                        delete message.source;
                        root['channel-messages'][channelId][messageId] = message;
                    }
                });
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
//# sourceMappingURL=fixup_to_simplified.js.map