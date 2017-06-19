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
function onWriteUnread(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.params) {
            return;
        }
        const userId = event.params.userId;
        const countRef = shared.database.ref(`/counters/${userId}/unreads`);
        try {
            yield countRef.transaction((current) => {
                if (shared.getAction(event) === Action.create) {
                    return (current || 0) + 1;
                }
                else if (shared.getAction(event) === Action.delete) {
                    return (current || 0) - 1;
                }
            });
        }
        catch (err) {
            console.error(`Error changing unread count: ${err.message}`);
        }
    });
}
exports.onWriteUnread = onWriteUnread;
function onWriteUnreadsCounter(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (shared.getAction(event) !== Action.delete) {
            return;
        }
        if (!event.params) {
            return;
        }
        const userId = event.params.userId;
        const countRef = shared.database.ref(`/counters/${userId}/unreads`);
        const unreadsRef = shared.database.ref(`/unreads/${userId}`);
        try {
            let count = 0;
            const groups = yield unreadsRef.once('value');
            groups.forEach((group) => {
                group.forEach((channel) => {
                    count += channel.numChildren();
                    return false;
                });
                return false;
            });
            yield countRef.set(count);
            console.log(`Recounting unreads for ${userId} total ${count}`);
        }
        catch (err) {
            console.error(`Error counting unreads: ${err.message}`);
        }
    });
}
exports.onWriteUnreadsCounter = onWriteUnreadsCounter;
//# sourceMappingURL=unreads.js.map