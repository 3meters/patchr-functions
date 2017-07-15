/*
 * Invite processing
 */
import * as _ from 'lodash'
import { mail as helper } from 'sendgrid'
import * as shared from './shared'
type DataSnapshot = shared.DataSnapshot
const Action = shared.Action
const SENDGRID_API_KEY = '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'

export async function onWriteInvite(event: shared.DatabaseEvent) {
  if (!event.params) { return }
  if (shared.getAction(event) === Action.create) {
    await created(event.data.current)
  } 
}

async function created(current: shared.DeltaSnapshot) {
  const invite = current.val()
  console.log(`Invite created: ${current.key}`)

  try {
    invite.id = current.key
    await sendInviteEmail(invite)
  } catch (err) {
    console.error(`Error sending invite email: ${err}`)
  }
}

async function sendInviteEmail(invite: any) {

  const mail = new helper.Mail()
  const personalization = new helper.Personalization()
  const fromEmail = new helper.Email('noreply@patchr.com', 'Patchr')

  mail.setFrom(fromEmail)
  if (invite.role === 'reader') {
    mail.setTemplateId('20036bc8-5a3c-4df2-8c3c-ee99df3b047f')
  } else {
    mail.setTemplateId('de969f30-f3a0-4aa3-8f91-9d349831f0f9')
  }

  personalization.addTo(new helper.Email(invite.email))
  personalization.addSubstitution(new helper.Substitution('-channel.name-', invite.channel.name))
  personalization.addSubstitution(new helper.Substitution('-user.title-', invite.inviter.title))
  personalization.addSubstitution(new helper.Substitution('-user.email-', invite.inviter.email))
  personalization.addSubstitution(new helper.Substitution('-link-', invite.link))

  mail.addPersonalization(personalization)

  const jsonEmail = mail.toJSON()
  const sendgrid = require('sendgrid')(SENDGRID_API_KEY)
  const request = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: jsonEmail,
  })

  try {
    const response = await sendgrid.API(request)
    await shared.database.ref(`invites/${invite.id}`).remove()
    console.log(`SendGrid: invite email sent to: ${invite.email}`)
  } catch (err) {
    const statusCode = err.response.statusCode
    if (statusCode === 429) {
      console.error(`SendGrid: too many requests: ${statusCode}`)
      throw new Error(`SendGrid: too many requests: ${statusCode}`)
    } else if (statusCode >= 400 && statusCode <= 499) {
      console.error(`SendGrid: error with the request: ${statusCode}`)
      throw new Error(`SendGrid: error with the request: ${statusCode}`)
    } else if (statusCode >= 500) {
      console.error(`SendGrid: error in SendGrid system: ${statusCode}`)
      throw new Error(`SendGrid: error in SendGrid system: ${statusCode}`)
    }
  }
}