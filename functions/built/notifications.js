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
 * Common database functions
 */
const shared = require("./shared");
function sendMessages(installs, message, payloadData) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            notification: {
                body: message,
                sound: 'chirp.caf',
            },
            data: payloadData,
        };
        const options = {
            contentAvailable: true,
            priority: 'high',
        };
        for (const install of installs) {
            if (install.unreads) {
                payload.notification.badge = '' + install.unreads; // force to string
            }
            const token = install.id;
            const userId = install.userId;
            const response = yield shared.messaging.sendToDevice(token, payload, options);
            const tokensToRemove = [];
            for (const result of response.results) {
                if (result.error) {
                    /* Cleanup the tokens who are not registered anymore. */
                    if (result.error.code === 'messaging/invalid-registration-token' ||
                        result.error.code === 'messaging/registration-token-not-registered') {
                        console.log(`Removing orphaned install for user: ${userId}: ${token}`);
                        tokensToRemove.push(shared.database.ref(`installs/${userId}/${token}`).remove());
                    }
                }
            }
            Promise.all(tokensToRemove);
        }
    });
}
exports.sendMessages = sendMessages;
//# sourceMappingURL=notifications.js.map