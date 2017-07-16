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
 * Channel member processing
 */
const shared = require("./shared");
const Action = shared.Action;
function onWriteMember(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.params) {
            return;
        }
        if (shared.getAction(event) === Action.create) {
            yield created(event.params, event.data.current);
        }
        else if (shared.getAction(event) === Action.delete) {
            yield deleted(event.params, event.data.previous);
        }
        else if (shared.getAction(event) === Action.change) {
            yield updated(event.params, event.data.previous, event.data.current);
        }
    });
}
exports.onWriteMember = onWriteMember;
function created(params, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const membership = current.val();
        console.log(`Member: ${params.userId} added to channel: ${params.channelId}`);
        try {
            yield shared.database.ref(`member-channels/${params.userId}/${params.channelId}`).set(membership);
        }
        catch (err) {
            console.error('Error adding channel member: ', err);
            return;
        }
    });
}
function updated(params, previous, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const membership = current.val();
        console.log(`Membership of: ${params.userId} updated for channel: ${params.channelId}`);
        try {
            yield shared.database.ref(`member-channels/${params.userId}/${params.channelId}`).set(membership);
        }
        catch (err) {
            console.error('Error updating channel member: ', err);
            return;
        }
    });
}
function deleted(params, previous) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Member: ${params.userId} removed from channel: ${params.channelId}`);
        const updates = {};
        updates[`member-channels/${params.userId}/${params.channelId}`] = null; // No trigger
        updates[`unreads/${params.userId}/${params.channelId}`] = null; // Delete trigger that updates counter
        try {
            yield shared.database.ref().update(updates);
        }
        catch (err) {
            console.error('Error removing channel member: ', err);
            return;
        }
    });
}
//# sourceMappingURL=channel-members.js.map