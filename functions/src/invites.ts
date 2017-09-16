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
  console.log(`Invite created: ${current.key} by: ${invite.inviter.id} for: ${invite.email}`)
  try {
    invite.id = current.key
    await sendInviteEmail(invite)
  } 
  catch (err) {
    console.error(`Error sending invite email: ${err}`)
  }
}

async function sendInviteEmail(invite: any) {

  const mail = new helper.Mail()
  const personalization = new helper.Personalization()
  const fromEmail = new helper.Email('noreply@patchr.com', 'Patchr')
  const language = invite.language
  let templateId = invite.message ? '20036bc8-5a3c-4df2-8c3c-ee99df3b047f' : 'de969f30-f3a0-4aa3-8f91-9d349831f0f9'
  let role = (invite.role === 'editor') ? 'contributor' : invite.role
  
  if (language) {
    if (language === 'ru') {
      /* Switch to russian templates when available */
      templateId = invite.message ? '2148f65c-535f-4db4-bf8c-ea18b7fb1917' : '61608101-327d-44c3-9622-def58a1c6a44'
      if (role === 'reader') {
        role = 'Читатель'
      }
      else if (role === 'contributor') {
        role = 'Вкладчик'
      }
      else if (role === 'owner') {
        role = 'Владелец'
      }
    }
  }

  mail.setFrom(fromEmail)
  mail.setTemplateId(templateId)

  personalization.addTo(new helper.Email(invite.email))
  personalization.addSubstitution(new helper.Substitution('-channel.title-', invite.channel.title))
  personalization.addSubstitution(new helper.Substitution('-user.title-', invite.inviter.title))
  personalization.addSubstitution(new helper.Substitution('-user.email-', invite.inviter.email))
  personalization.addSubstitution(new helper.Substitution('-role-', role))
  personalization.addSubstitution(new helper.Substitution('-link-', invite.link))

  if (invite.message) {
    personalization.addSubstitution(new helper.Substitution('-message-', invite.message))    
  }

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
      console.error(`SendGrid: error with the request: code: ${statusCode} request: ${request}`)
      throw new Error(`SendGrid: error with the request: code: ${statusCode} request: ${request}`)
    } else if (statusCode >= 500) {
      console.error(`SendGrid: error in SendGrid system: ${statusCode}`)
      throw new Error(`SendGrid: error in SendGrid system: ${statusCode}`)
    }
  }
}