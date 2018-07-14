
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/* tslint:disable */

var functions = require('firebase-functions');
var firebase = require('firebase-admin')
var async = require('async')
var serviceAccount = "service-credentials.json"
var https = require('https');
var helper = require('sendgrid').mail
var utils = require('./utilities.js')
var errors = utils.errors
var _ = require('lodash');

process.env.SENDGRID_API_KEY = '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'

// Can only call admin auth methods like creating and verifying tokens
var admin = firebase.initializeApp({
  databaseURL: "https://patchr-ios.firebaseio.com",
  credential: firebase.credential.cert(serviceAccount),
  databaseAuthVariableOverride: {
    uid: "patchr-cloud-worker"
  }
})

/* Custom error codes
 * 403 = Permission denied
 * 
 */

var priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9]
var priorities_reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1]

run()

function run() {
  console.log('Patchr running...')
  var port = process.env.PORT || 8080
  console.log("Assigned port: " + port)
  admin.database().ref('counters').remove()
  startTaskListeners()
}

function startTaskListeners() {
  admin.database().ref('queue/clear-unreads').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    task.key = snap.key
    task.path = `queue/clear-unreads/${task.key}`
    startTask(task)
    clearUnreads(task, function(err) {
      if (err) {
        console.error('Error clearing unreads:', err)
        errorTask(task, err)
        return
      }
      finishTask(task, true)
    })
  })
  admin.database().ref('queue/create-user').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    console.log('Create user processing')
    task.key = snap.key
    task.path = `queue/create-user/${task.key}`
    startTask(task)
    createUser(task)
  })
  admin.database().ref('queue/deletes').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    console.log('Delete task processing')
    task.key = snap.key
    task.path = `queue/deletes/${task.key}`
    startTask(task)
    processDelete(task)
  })
  admin.database().ref('queue/invites').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    console.log('Invite task processing')
    task.key = snap.key
    task.path = `queue/invites/${task.key}`
    startTask(task)
    processInvite(task)
  })
  admin.database().ref('queue/join-group').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    console.log('Join task processing')
    task.key = snap.key
    task.path = `queue/join-group/${task.key}`
    startTask(task)
    processJoin(task)
  })
  admin.database().ref('queue/notifications').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    console.log('Notification task processing')
    task.key = snap.key
    task.path = `queue/notifications/${task.key}`
    startTask(task)
    processNotification(task)
  })
  admin.database().ref('queue/update-username').on('child_added', function(snap) {
    var task = snap.val()
    if (task.state != 'waiting') { return }
    console.log('Update username processing')
    task.key = snap.key
    task.path = `queue/update-username/${task.key}`
    startTask(task)
    updateUsername(task)
  })
}

function createUser(task) {
  let user = {
    created_at: {'.sv': 'timestamp'},
    created_by: task.created_by,
    modified_at: {'.sv': 'timestamp'},
    username: task.username,
  }

  /* Validation will catch duplicate username */
  admin.database().ref(`users/${task.user_id}`).set(user, function(error) {
    if (error) {
      errorTask(task, {
        message: `Error: ${error}`
      })
      return
    }
    /* Claim username */
    admin.database().ref(`usernames/${task.username}`).set(task.user_id)
    finishTask(task, true)
  })
}

function updateUsername(task) {

  admin.database().ref(`users/${task.user_id}/username`).once('value', function(snap) {
    const priorUsername = snap.val()
    let update = {}
    update[`users/${task.user_id}/username`] = task.username
    update[`users/${task.user_id}/modified_at`] = {
      '.sv': 'timestamp'
    }

    /* Validation will catch duplicate username */
    admin.database().ref().update(update, function(error) {
      if (error) {
        errorTask(task, {
          message: `Error: ${error}`
        })
        return
      }
      /* Release old username and claim new one */
      admin.database().ref(`usernames/${priorUsername}`).remove()
      admin.database().ref(`usernames/${task.username}`).set(task.user_id)
      finishTask(task, true)
    })
  })
}

function clearUnreads(task, then) {
  var groupId = task.group_id
  var channelId = task.channel_id
  var messageId = task.message_id

  if (task.target === 'group') {
    admin.database().ref(`group-members/${groupId}`).once('value', function(snap) {
      if (snap.val()) {
        var memberIds = []
        snap.forEach(function(child) {
          memberIds.push(child.key)
        })
        async.each(memberIds,
          function(userId, next) {
            admin.database().ref(`unreads/${userId}/${groupId}`).remove(function(error) {
              next(error)
            })
          },
          function(err) {
            if (err) console.error(`Error clearing unreads: ${task.key}`, err)
            then(err)
          }
        )
      }
      else {
        then()
      }
    })
  }
  else {
    admin.database().ref(`group-channel-members/${groupId}/${channelId}`).once('value', function(snap) {
      if (snap.val()) {
        var memberIds = []
        snap.forEach(function(child) {
          memberIds.push(child.key)
        })
        async.each(memberIds,
          function(userId, next) {
            var ref = admin.database().ref(`unreads/${userId}/${groupId}`)
            if (task.target === 'channel') {
              ref = ref.child(channelId)
            }
            else if (task.target === 'message') {
              ref = ref.child(channelId).child(messageId)
            }
            ref.remove(function(error) {
              next(error)
            })
          },
          function(err) {
            if (err) console.error(`Error clearing unreads: ${task.key}`, err)
            then(err)
          }
        )
      }
      else {
        then()
      }
    })
  }
}

function processDelete(task) {

  if (task.target === 'channel') { // Channel delete
    deleteChannel(task.group_id, task.channel_id, function(err) {
      if (err) {
        console.error(`Error deleting channel: ${task.channel_id} for group: ${task.group_id}`, err)
        errorTask(task, err)
        return
      }
      console.log(`Channel deleted: ${task.channel_id} for group: ${task.group_id}`)
      finishTask(task, true)
    })
  }
  else if (task.target === 'group') {
    deleteGroup(task.group_id, function(err) {
      if (err) {
        console.error(`Error deleting group: ${task.group_id}`, err)
        errorTask(task, err)
        return
      }
      console.log(`Group deleted: ${task.group_id}`)
      finishTask(task, true)
    })
  }

  function deleteChannel(groupId, channelId, then) {

    phaseOne(groupId, channelId, then)

    function phaseOne(groupId, channelId, then) {
      /* Delete channel and channel messages, remove from group default channels */
      admin.database().ref(`group-channels/${groupId}/${channelId}`).once('value', function(snap) {
        const name = snap.val().name

        let update = {}
        update[`group-messages/${groupId}/${channelId}`] = null
        update[`group-channels/${groupId}/${channelId}`] = null
        update[`channel-names/${groupId}/${name}`] = null

        admin.database().ref(`groups/${groupId}/default_channels`).once('value', function(snap) {
          if (snap.val()) {
            let newDefaults = []
            snap.val().forEach(function(defaultChannelId) {
              if (channelId !== defaultChannelId) {
                newDefaults.push(defaultChannelId)
              }
            })
            update[`groups/${groupId}/default_channels`] = newDefaults
          }
          admin.database().ref().update(update, function(err) {
            if (err) return then(err)
            let clearTask = {
              target: "channel",
              group_id: groupId,
              channel_id: channelId,
            }
            clearUnreads(clearTask, function(err) {
              if (err) return then(err)
              phaseTwo(groupId, channelId, then)
            })
          })
        })
      })
    }

    function phaseTwo(groupId, channelId, then) {
      /* Delete channel memberships */
      let update = {}
      update[`group-channel-members/${groupId}/${channelId}`] = null
      admin.database().ref(`group-channel-members/${groupId}/${channelId}`).once('value', function(snap) {
        if (snap.val()) {
          snap.forEach(function(child) {
            update[`member-channels/${child.key}/${groupId}/${channelId}`] = null
          })
        }
        admin.database().ref().update(update, function(err) {
          then(err)
        })
      })
    }
  }

  function deleteGroup(groupId, then) {

    phaseOne(groupId, then)

    function phaseOne(groupId, then) {
      /* Delete all channels for the group, handles unreads */
      admin.database().ref(`group-channels/${groupId}`).once('value', function(snap) {
        let channelIds = []
        if (snap.val()) {
          snap.forEach(function(channel) {
            channelIds.push(channel.key)
          })
        }
        async.each(channelIds,
          function(channelId, next) {
            deleteChannel(groupId, channelId, function(err) {
              next(err)
            })
          },
          function(err) {
            if (err) return then(err)
            admin.database().ref(`group-channels/${groupId}`).remove(function(err) {
              if (err) return then(err)
              admin.database().ref(`invites/${groupId}`).remove(function(err) {
                if (err) return then(err)
                phaseTwo(groupId, then)
              })
            })
          }
        )
      })
    }

    function phaseTwo(groupId, then) {
      /* Delete group */
      admin.database().ref(`groups/${groupId}`).remove(function(err) {
        if (err) return then(err)
        phaseThree(groupId, then)
      })
    }

    function phaseThree(groupId, then) {
      /* Delete group memberships */
      let updates = {}
      updates[`group-members/${groupId}`] = null
      updates[`channel-names/${groupId}`] = null
      admin.database().ref(`group-members/${groupId}`).once('value', function(snap) {
        if (snap.val()) {
          snap.forEach(function(member) {
            updates[`member-groups/${member.key}/${groupId}`] = null
          })
        }
        admin.database().ref().update(updates, function(err) {
          then(err)
        })
      })
    }
  }
}

function processInvite(task) {
  /* Make sure the inviter is a member the group and any channels */
  const groupId = task.group.id
  const inviterId = task.inviter.id

  checkMemberships(task)

  function checkMemberships(task) {
    admin.database().ref(`group-members/${groupId}/${inviterId}`).once('value', function(snap) {
      if (!snap.exists()) {
        console.error('Invite task terminated and removed: inviter is not a member of invite group')
        errorTask(task, {
          message: 'Invite task terminated and removed: inviter is not a member of invite group'
        })
        return
      }
      if (!task.channels) {
        sendEmail(task)
        return
      }
      var channelIds = []
      _.forOwn(task.channels, function(value, key) {
        channelIds.push(key)
      })
      async.each(channelIds,
        function(channelId, next) {
          let path = `group-channel-members/${groupId}/${channelId}/${inviterId}`
          admin.database().ref(path).once('value', function(snap) {
            if (!snap.exists) return next(true)
            next()
          })
        },
        function(err) {
          if (err) {
            console.error('Invite task terminated and removed: inviter is not a member of invite channel')
            errorTask(task, {
              message: 'Invite task terminated and removed: inviter is not a member of invite channel'
            })
            return
          }
          sendEmail(task)
        }
      )
    })
  }

  function sendEmail(task) {
    var mail = new helper.Mail()
    var personalization = new helper.Personalization()
    var fromEmail = new helper.Email("noreply@patchr.com", "Patchr")

    mail.setFrom(fromEmail)
    if (task.type === 'invite-members') {
      mail.setTemplateId('de969f30-f3a0-4aa3-8f91-9d349831f0f9')
    }
    else if (task.type === 'invite-guests') {
      mail.setTemplateId('20036bc8-5a3c-4df2-8c3c-ee99df3b047f')
    }
    else if (task.type === 'invite-guests-multi-channel') {
      mail.setTemplateId('66273ef5-e4ce-46e2-b4a1-a449f7386006')
    }

    personalization.addTo(new helper.Email(task.recipient))
    personalization.addSubstitution(new helper.Substitution('-group.title-', task.group.title))
    personalization.addSubstitution(new helper.Substitution('-user.title-', task.inviter.title))
    personalization.addSubstitution(new helper.Substitution('-user.email-', task.inviter.email))
    personalization.addSubstitution(new helper.Substitution('-link-', task.link))
    if (task.channels) {
      var channelName = task.channels[Object.getOwnPropertyNames(task.channels)[0]]
      personalization.addSubstitution(new helper.Substitution('-channel.name-', channelName))
    }

    mail.addPersonalization(personalization)

    var jsonEmail = mail.toJSON()
    var sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY)
    var emptyRequest = require('sendgrid-rest').request
    var requestPost = JSON.parse(JSON.stringify(emptyRequest))

    requestPost.method = 'POST'
    requestPost.path = '/v3/mail/send'
    requestPost.body = jsonEmail

    sendgrid.API(requestPost, function(error, res) {
      console.log('SendGrid: invite status code', res.statusCode)
      if (res.statusCode === 202) {
        console.log('SendGrid: invite email success')
        createInvites(task)
      }
      else if (res.statusCode === 429) {
        console.error('SendGrid: too many requests')
        errorTask(task, {
          message: 'SendGrid: too many requests'
        })
      }
      else if (res.statusCode >= 400 && res.statusCode <= 499) {
        console.error('SendGrid: error with the request')
        errorTask(task, {
          message: 'SendGrid: error with the request'
        })
      }
      else if (res.statusCode >= 500) {
        console.error('SendGrid: error in SendGrid system')
        errorTask(task, {
          message: 'SendGrid: error in SendGrid system'
        })
      }
    })
  }

  function createInvites(task) {
    /* Create or update invites for each recipient */
    var role = (task.type === 'invite-members') ? 'member' : 'guest'
    var timestamp = Date.now()
    var inviteId = task.invite_id
    var invite = {
      created_by: task.inviter.id,
      created_at: timestamp,
      email: task.recipient,
      group: task.group,
      role: role,
      inviter: task.inviter,
      link: task.link,
      invited_at: timestamp,
      invited_at_desc: timestamp * -1,
      status: "pending",
    }
    admin.database().ref(`invites/${groupId}/${inviterId}/${inviteId}`).set(invite)
    finishTask(task, true)
  }
}

function processJoin(task) {
  /* Lookup invite if identified
     Add to group-members and member-groups
     Add to channels if provided
     Add to default channels if not guests
     Process invite */

  let invite = null
  let defaultChannels = null

  checkGroupExists(task)

  function checkGroupExists(task) {
    let path = `groups/${task.group_id}/default_channels`
    admin.database().ref(path).once('value', function(snap) {
      if (!snap.exists()) {
        errorTask(task, errors.not_found_group)
      }
      else {
        lookupInvite(task)
        defaultChannels = snap.val()
      }
    })
  }

  function lookupInvite(task) {
    if (task.invite_id) {
      let path = `invites/${task.group_id}/${task.invited_by}/${task.invite_id}`
      admin.database().ref(path).once('value', function(snap) {
        if (!snap.exists()) {
          errorTask(task, errors.not_found_invite)
        }
        else {
          invite = snap.val()
          invite.ref = snap.ref
          /* Revalidate */
          if (invite.status !== 'pending') {
            errorTask(task, errors.invalid_invite)
          }
          else if (invite.group.id !== task.group_id) {
            errorTask(task, errors.invalid_invite)
          }
          else {
            /* task.role wins over invite.role because role upgrades from guest to member
               if the invitee is already a full group member. */
            task.channels = invite.channels
            addAsMember(task)
          }
        }
      })
    }
  }

  function addAsMember(task) {
    const groupPriority = (task.role === 'guest') ? 5 : 4
    const timestamp = Date.now()
    const membership = groupMemberMap(task.user_id, timestamp, groupPriority, task.role, task.email)
    let updates = {}
    updates[`group-members/${task.group_id}/${task.user_id}`] = membership
    updates[`member-groups/${task.user_id}/${task.group_id}`] = membership
    admin.database().ref().update(updates, function(err) {
      if (err) {
        errorTask(task, errors.permission_denied) // caused by validation rules
      }
      else if (task.channels) {
        addToChannels(task)
      }
      else if (task.role !== 'guest') {
        addToDefaultChannels(task)
      }
      else if (invite) {
        processInvite(task)
      }
      else {
        finished(task)
      }
    })
  }

  function addToChannels(task) {
    const timestamp = Date.now()
    const membership = channelMemberMap(task.user_id, timestamp, 4, 'member')
    let updates = {}
    _.forOwn(task.channels, function(value, key) {
      updates[`group-channel-members/${task.group_id}/${key}/${task.user_id}/`] = membership
      updates[`member-channels/${task.user_id}/${task.group_id}/${key}/`] = membership
      let text = `joined #${value}.`
      if (invite) {
        text = `joined #${value} by invitation from ${invite.inviter.username}.`
      }
      const messageId = utils.generatePushID(timestamp)
      const message = {
        "created_at": timestamp,
        "created_at_desc": timestamp * -1,
        "created_by": task.user_id,
        "modified_at": timestamp,
        "modified_by": task.user_id,
        "source": "system",
        "group_id": task.group_id,
        "channel_id": key,
        "text": text,
      }
      updates[`group-messages/${task.group_id}/${key}/${messageId}/`] = message
    })

    admin.database().ref().update(updates, function(err) {
      if (err) {
        errorTask(task, errors.permission_denied) // caused by validation rules
      }
      else if (task.role !== 'guest') {
        addToDefaultChannels(task)
      }
      else if (invite) {
        processInvite(task)
      }
      else {
        finished(task)
      }
    })
  }

  function addToDefaultChannels(task) {
    const timestamp = Date.now()
    const membership = channelMemberMap(task.user_id, timestamp, 4, 'member')
    let updates = {}
    defaultChannels.forEach(function(channelId) {
      updates[`group-channel-members/${task.group_id}/${channelId}/${task.user_id}/`] = membership
      updates[`member-channels/${task.user_id}/${task.group_id}/${channelId}/`] = membership
      let text = `joined.`
      if (invite) {
        text = `joined by invitation from ${invite.inviter.username}.`
      }
      const messageId = utils.generatePushID(timestamp)
      const message = {
        "created_at": timestamp,
        "created_at_desc": timestamp * -1,
        "created_by": task.user_id,
        "modified_at": timestamp,
        "modified_by": task.user_id,
        "source": "system",
        "group_id": task.group_id,
        "channel_id": channelId,
        "text": text,
      }
      updates[`group-messages/${task.group_id}/${channelId}/${messageId}/`] = message
    })
    admin.database().ref().update(updates, function(err) {
      if (err) {
        errorTask(task, errors.permission_denied) // caused by validation rules
      }
      else if (invite) {
        processInvite(task)
      }
      else {
        finished(task)
      }
    })
  }

  function processInvite(task) {
    const timestamp = Date.now()
    let updates = {}
    let path = `invites/${task.group_id}/${task.invited_by}/${task.invite_id}`
    updates[`${path}/accepted_at`] = timestamp
    updates[`${path}/accepted_by`] = task.user_id
    updates[`${path}/status`] = 'accepted'
    admin.database().ref().update(updates, function(err) {
      if (err) {
        errorTask(task, errors.permission_denied) // caused by validation rules
      }
      else {
        finished(task)
      }
    })
  }

  function finished(task) {
    finishTask(task, true)
  }
}

function processNotification(task) {
  const channelId = task.channel_id
  const groupId = task.group_id
  const messageId = task.key

  gatherPushTargets(task)

  function gatherPushTargets(task) {
    admin.database().ref(`group-channel-members/${groupId}/${channelId}`).once('value', function(snap) {
      var pushs = []
      snap.forEach(function(child) {
        if (child.key !== task.created_by && !child.val().muted) {
          pushs.push({
            userId: child.key
          })
        }
      })
      if (pushs.length > 0) {
        console.log('Channel members to notify: ' + pushs.length)
        updateUnreads(pushs, task)
        return
      }
      if (pushs.length === 0) {
        console.log('Channel members: none to notify')
        console.log('Notification processing stopped')
        finishTask(task, true)
        return
      }
    })
  }

  function updateUnreads(pushs, task) {
    async.each(pushs,
      function(push, next) {
        var userId = push.userId
        admin.database().ref(`counters/${userId}/unreads`).once('value', function(snap) {
          let unreads = 1
          if (snap.val()) {
            unreads = snap.val() + 1
          }
          push.unreads = unreads
          admin.database().ref(`unreads/${userId}/${groupId}/${channelId}/${messageId}`).set(true)
          next()
        })
      },
      function(err) {
        if (!err) {
          updateSorting(pushs, task)
          return
        }
        console.error('Error updating unreads: ', err)
        errorTask(task, err)
      }
    )
  }

  function updateSorting(pushs, task) {
    async.each(pushs,
      function(push, next) {
        let userId = push.userId
        admin.database().ref(`member-channels/${userId}/${groupId}/${channelId}`).once('value', function(snap) {
          let member = snap.val()
          if (member.priority === 0) return next()
          var timestamp = member.joined_at // not a real timestamp, shortened to 10 digits
          snap.ref.update({
            priority: 0,
            index_priority_joined_at: parseInt('' + priorities[0] + timestamp),
            index_priority_joined_at_desc: parseInt('' + priorities_reversed[0] + timestamp) * -1
          })
          next()
        })
      },
      function(err) {
        if (!err) {
          findInstalls(pushs, task)
          return
        }
        console.error('Error updating sorting:', err)
        errorTask(task, err)
      }
    )
  }

  function findInstalls(pushs, task) {
    var installs = []
    async.each(pushs,
      function(push, next) {
        admin.database().ref(`installs/${push.userId}`).once('value', function(snap) {
          snap.forEach(function(install) {
            installs.push({
              id: install.key,
              userId: push.userId,
              unreads: push.unreads
            })
          })
          next()
        })
      },
      function(err) {
        if (!err) {
          console.log('Installs to notify: ' + installs.length)
          sendMessages(installs, task)
          return
        }
        console.error('Error finding installs:', err)
        errorTask(task, err)
      }
    )
  }

  function sendMessages(installs, task) {

    let headers = {
      "Content-Type": "application/json",
      "Authorization": 'key=AIzaSyBnNr7d20fOet2jhAkNN2QnLtF9jlLXfO0'
    }

    let params = {
      host: "fcm.googleapis.com",
      port: 443,
      path: "/fcm/send",
      method: "POST",
      headers: headers
    }

    var bodyValue

    if (task.photo) {
      bodyValue = `#${task.channelName} @${task.username}: @${task.username} posted a photo`
      if (task.text) {
        bodyValue += ` and commented: ${task.text}`
      }
    }
    else if (task.text) {
      bodyValue = `#${task.channelName} @${task.username}: ${task.text}`
    }

    var payload = {
      notification : {
        body: bodyValue,
        sound: 'chirp.caf'
      },
      data : {
        user_id: task.created_by,
        group_id: groupId,
        channel_id: channelId,
        message_id: messageId
      },
      content_available : true
    }

    console.log(`Notification: ${JSON.stringify(payload.notification)}`)

    async.each(installs,
      function(install, next) {
        payload['to'] = install.id
        payload.notification['badge'] = install.unreads
        console.log(`Install: ${payload['to']}, unread: ${payload.notification['badge']}`)
        var req = https.request(params, function(res) {
          console.log('Provider: status code', res.statusCode)
          if (res.statusCode === 400) {
            console.log('Provider: notification failure')
          }
          else if (res.statusCode === 200) {
            console.log('Provider: notification success')
          }
          res.on('data', function(data) {
            let body = JSON.parse(data)
            console.log('Provider: results', body.results)
            if (body.failure > 0) {
              scrubOrphanedInstalls(install, body.results) // async
            }
            next()
          })
        })
        req.on('error', function(err) {
          if (err) {
            next(err)
          }
        })
        req.write(JSON.stringify(payload))
        req.end()
      },
      function(err) {
        if (err) {
          console.error('Error sending notification:', err)
          errorTask(task, err)
          return
        }
        finishTask(task, true)
      }
    )
  }

  function scrubOrphanedInstalls(install, results) {
    var index = 0
    results.forEach(function(result) {
      if (result.error && result.error === 'NotRegistered') {
        let installId = install.id
        let userId = install.userId
        console.log(`Removed orphaned install for user: ${userId}: ${installId}`)
        admin.database().ref(`installs/${userId}/${installId}`).remove()
      }
      index++
    })
  }
}

function groupMemberMap(userId, timestamp, priorityIndex, role, email) {

  let joinedAt = timestamp / 1000 // shorten to 10 digits
  let index = parseInt('' + priorities[priorityIndex] + timestamp)
  let indexReversed = parseInt('' + priorities_reversed[priorityIndex] + timestamp) * -1

  let membership = {
    "created_at": timestamp,
    "created_by": userId,
    "disabled": false,
    "joined_at": joinedAt, // Not a real unix epoch timestamp, only 10 digits instead of 13
    "joined_at_desc": joinedAt * -1,
    "index_priority_joined_at": index,
    "index_priority_joined_at_desc": indexReversed,
    "notifications": "all",
    "priority": priorityIndex,
    "role": role,
  }

  if (email) {
    membership['email'] = email
  }

  return membership
}

function channelMemberMap(userId, timestamp, priorityIndex, role) {

  let joinedAt = timestamp / 1000 // shorten to 10 digits
  let index = parseInt('' + priorities[priorityIndex] + timestamp)
  let indexReversed = parseInt('' + priorities_reversed[priorityIndex] + timestamp) * -1

  let membership = {
    "archived": false,
    "created_at": timestamp,
    "created_by": userId,
    "joined_at": joinedAt, // Not a real unix epoch timestamp, only 10 digits instead of 13
    "joined_at_desc": joinedAt * -1,
    "index_priority_joined_at": index,
    "index_priority_joined_at_desc": indexReversed,
    "muted": false,
    "priority": priorityIndex,
    "role": role,
    "starred": false,
  }

  return membership
}

function countUnreads(groups) {
  let count = 0
  _.forOwn(groups.val(), function(group) {
    _.forOwn(group, function(channel) {
      count += _.size(channel)
    })
  })
  admin.database().ref(`counters/${groups.key}`).set({
    'unreads': count
  })
}

function startTask(task) {
  admin.database().ref(`${task.path}/state`).set('processing')
}

function errorTask(task, error) {
  admin.database().ref(`${task.path}/error`).set(error)
  finishTask(task, true)
}

function finishTask(task, result) {
  let updates = {}
  updates[`${task.path}/state`] = 'finished'
  if (result) {
    updates[`${task.path}/result`] = result
  }
  admin.database().ref().update(updates, function(err) {
    if (err) {
      errorTask(task, errors.permission_denied) // caused by validation rules
    }
    else if (!task.retain) {
      admin.database().ref(task.path).remove()
    }
  })
}