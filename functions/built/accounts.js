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
        const ownedChannelIds = yield shared.getOwnedChannelIds(userId);
        const memberChannelIds = yield shared.getMemberChannelIds(userId);
        const updates = {};
        /* We remove everything except content.
          - messages: show user as deleted.
          - reactions: show user as deleted.
          - comments: show user as deleted. */
        console.log(`Deleting user: ${userId}`);
        updates[`users/${userId}`] = null; // Also trigger release of username
        /* Delete all owned channels */
        if (ownedChannelIds.length > 0) {
            ownedChannelIds.forEach((channelId) => {
                updates[`channels/${channelId}`] = null;
            });
        }
        /* Remove all channel memberships */
        if (memberChannelIds.length > 0) {
            memberChannelIds.forEach((channelId) => {
                updates[`channel-members/${channelId}/${userId}`] = null;
            });
        }
        /* Remove activity */
        updates[`activity/${userId}`] = null;
        yield shared.database.ref().update(updates);
    });
}
exports.onDeleteAccount = onDeleteAccount;
//# sourceMappingURL=accounts.js.map