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
const sendgrid_1 = require("sendgrid");
const shared = require("./shared");
const Action = shared.Action;
const SENDGRID_API_KEY = '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';
function onWriteInvite(event) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.params) {
            return;
        }
        if (shared.getAction(event) === Action.create) {
            yield created(event.data.current);
        }
    });
}
exports.onWriteInvite = onWriteInvite;
function created(current) {
    return __awaiter(this, void 0, void 0, function* () {
        const invite = current.val();
        console.log(`Invite created: ${current.key} by: ${invite.inviter.id} for: ${invite.email}`);
        try {
            invite.id = current.key;
            yield sendInviteEmail(invite);
        }
        catch (err) {
            console.error(`Error sending invite email: ${err}`);
        }
    });
}
function sendInviteEmail(invite) {
    return __awaiter(this, void 0, void 0, function* () {
        const mail = new sendgrid_1.mail.Mail();
        const personalization = new sendgrid_1.mail.Personalization();
        const fromEmail = new sendgrid_1.mail.Email('noreply@patchr.com', 'Patchr');
        const language = invite.language;
        let templateId = invite.message ? '20036bc8-5a3c-4df2-8c3c-ee99df3b047f' : 'de969f30-f3a0-4aa3-8f91-9d349831f0f9';
        let role = (invite.role === 'editor') ? 'contributor' : invite.role;
        if (language) {
            if (language === 'ru') {
                /* Switch to russian templates when available */
                templateId = invite.message ? '2148f65c-535f-4db4-bf8c-ea18b7fb1917' : '61608101-327d-44c3-9622-def58a1c6a44';
                if (role === 'reader') {
                    role = 'Читатель';
                }
                else if (role === 'contributor') {
                    role = 'Вкладчик';
                }
                else if (role === 'owner') {
                    role = 'Владелец';
                }
            }
        }
        mail.setFrom(fromEmail);
        mail.setTemplateId(templateId);
        personalization.addTo(new sendgrid_1.mail.Email(invite.email));
        personalization.addSubstitution(new sendgrid_1.mail.Substitution('-channel.title-', invite.channel.title));
        personalization.addSubstitution(new sendgrid_1.mail.Substitution('-user.title-', invite.inviter.title));
        personalization.addSubstitution(new sendgrid_1.mail.Substitution('-user.email-', invite.inviter.email));
        personalization.addSubstitution(new sendgrid_1.mail.Substitution('-role-', role));
        personalization.addSubstitution(new sendgrid_1.mail.Substitution('-link-', invite.link));
        if (invite.message) {
            personalization.addSubstitution(new sendgrid_1.mail.Substitution('-message-', invite.message));
        }
        mail.addPersonalization(personalization);
        const jsonEmail = mail.toJSON();
        const sendgrid = require('sendgrid')(SENDGRID_API_KEY);
        const request = sendgrid.emptyRequest({
            method: 'POST',
            path: '/v3/mail/send',
            body: jsonEmail,
        });
        try {
            const response = yield sendgrid.API(request);
            yield shared.database.ref(`invites/${invite.id}`).remove();
            console.log(`SendGrid: invite email sent to: ${invite.email}`);
        }
        catch (err) {
            const statusCode = err.response.statusCode;
            if (statusCode === 429) {
                console.error(`SendGrid: too many requests: ${statusCode}`);
                throw new Error(`SendGrid: too many requests: ${statusCode}`);
            }
            else if (statusCode >= 400 && statusCode <= 499) {
                console.error(`SendGrid: error with the request: code: ${statusCode} request: ${request}`);
                throw new Error(`SendGrid: error with the request: code: ${statusCode} request: ${request}`);
            }
            else if (statusCode >= 500) {
                console.error(`SendGrid: error in SendGrid system: ${statusCode}`);
                throw new Error(`SendGrid: error in SendGrid system: ${statusCode}`);
            }
        }
    });
}
//# sourceMappingURL=invites.js.map