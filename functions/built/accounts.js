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
function onDeleteAccount(event) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = event.data;
        const userId = user.uid;
        const username = (yield shared.getUser(userId)).val().username;
        const ownedChannelIds = yield shared.getOwnedChannelIds(userId);
        const updates = {};
        if (username) {
            console.log(`Releasing username: ${username}`);
            updates[`usernames/${username}`] = null;
        }
        if (ownedChannelIds.length > 0) {
            ownedChannelIds.forEach((channelId) => {
                updates[`channels/${channelId}`] = null;
            });
        }
        yield shared.database.ref().update(updates);
    });
}
exports.onDeleteAccount = onDeleteAccount;
//# sourceMappingURL=accounts.js.map