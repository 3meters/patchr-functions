const firebase = require('firebase-admin')
const serviceAccount = "service-credentials.json"
const _ = require('lodash');

// Can only call admin auth methods like creating and verifying tokens
const admin = firebase.initializeApp({
  databaseURL: "https://patchr-ios.firebaseio.com",
  credential: firebase.credential.cert(serviceAccount),
  databaseAuthVariableOverride: {
    uid: "patchr-cloud-worker"
  }
})

run()

/* jshint -W098 */
function run() {
  console.log('Fixup running...')
  let port = process.env.PORT || 8080
  console.log("Assigned port: " + port)
  //fixupEmails()
}

function fixupEmails() {
  admin.database().ref('group-members').once('value', function(groups) {
    groups.forEach(function(group) {
      const groupId = group.key
      group.forEach(function(user) {
        const userId = user.key
        const hideEmail = user.val().hide_email
        admin.database().ref(`emails/${userId}`).once('value', function(snap) {
          const email = snap.val()
          console.log(`group-members/${groupId}/${userId}/email`)
          admin.database().ref(`group-members/${groupId}/${userId}/hide_email`).remove()
          admin.database().ref(`member-groups/${userId}/${groupId}/hide_email`).remove()
          admin.database().ref(`group-members/${groupId}/${userId}/email`).set(email)
          admin.database().ref(`member-groups/${userId}/${groupId}/email`).set(email)
        })        
      })
    })
  })
}

function fixupChannelNames() {
  admin.database().ref('group-channels').once('value', function(snap) {
    snap.forEach(function(group) {
      let groupId = group.key
      group.forEach(function(channel) {
        let channelId = channel.key        
        let channelName = channel.val().name
        admin.database().ref(`channel-names/${groupId}/${channelName}`).set(channelId)
      })
    })
  })
}

function fixupMemberChannels() {
  admin.database().ref('member-channels').once('value', function(snap) {
    snap.forEach(function(user) {
      let userId = user.key
      user.forEach(function(group) {
        let groupId = group.key
        group.forEach(function(channel) {
          let channelId = channel.key
          admin.database().ref(`group-channel-members/${groupId}/${channelId}/${userId}`).set(channel.val())
        })
      })
    })
  })
}

function fixupMemberGroups() {
  admin.database().ref('member-groups').once('value', function(snap) {
    snap.forEach(function(user) {
      let userId = user.key
      user.forEach(function(group) {
        let groupId = group.key
        let createdBy = userId
        let createdAt = group.val().joined_at
        admin.database().ref(`member-groups/${userId}/${groupId}/created_by`).set(createdBy)
        admin.database().ref(`member-groups/${userId}/${groupId}/created_at`).set(createdAt)
      })
    })
  })
}

function fixupChannels() {
  admin.database().ref('group-channels').once('value', function(snap) {
    snap.forEach(function(group) {
      let groupId = group.key
      group.forEach(function(channel) {
        let channelId = channel.key
        let createdBy = channel.val().created_by
        admin.database().ref(`group-channels/${groupId}/${channelId}/owned_by`).set(createdBy)
        admin.database().ref(`group-channels/${groupId}/${channelId}/group_id`).set(groupId)
        admin.database().ref(`group-channels/${groupId}/${channelId}/group`).remove()
      })
    })
  })
}

function fixupMessages() {
  admin.database().ref('group-messages').once('value', function(snap) {
    snap.forEach(function(group) {
      let groupId = group.key
      group.forEach(function(channel) {
        let channelId = channel.key
        channel.forEach(function(message) {
          let messageId = message.key
          admin.database().ref(`group-messages/${groupId}/${channelId}/${messageId}/group_id`).set(groupId)
          admin.database().ref(`group-messages/${groupId}/${channelId}/${messageId}/channel_id`).set(channelId)
          admin.database().ref(`group-messages/${groupId}/${channelId}/${messageId}/group`).remove()
          admin.database().ref(`group-messages/${groupId}/${channelId}/${messageId}/channel`).remove()
        })
      })
    })
  })
}

function fixupUsers() {
  admin.database().ref('users').once('value', function(snap) {
    snap.forEach(function(snapUser) {
      let userId = snapUser.key
      admin.database().ref(`users/${userId}/created_by`).set(userId)
    })
  })
}

function addGroupIdsToIndexes() {

  let channelGroupMap = {}
  mapChannelsToGroups()

  function mapChannelsToGroups() {
    admin.database().ref('group-channels').once('value', function(snap) {
      snap.forEach(function(snapGroup) {
        let groupId = snapGroup.key
        snapGroup.forEach(function(snapChannel) {
          let channelId = snapChannel.key
          channelGroupMap[channelId] = groupId
        })
      })
      addGroupIdsForMessages()
    })
  }

  function addGroupIdsForMessages() {
    admin.database().ref('group-messages').remove()
    admin.database().ref('channel-messages').once('value', function(snap) {
      snap.forEach(function(snapChannel) {
        let channelId = snapChannel.key
        let groupId = channelGroupMap[channelId]
        if (groupId) {
          snapChannel.forEach(function(snapMessage) {
            let messageId = snapMessage.key
            let message = snapMessage.val()
            message.group = groupId
            admin.database().ref('group-messages/' + groupId + '/' + channelId + '/' + messageId).set(message)
          })
        }
      })
      addGroupIdsForChannelMembers()
    })
  }

  function addGroupIdsForChannelMembers() {
    admin.database().ref('channel-members').once('value', function(snap) {
      snap.forEach(function(snapChannel) {
        let channelId = snapChannel.key
        let groupId = channelGroupMap[channelId]
        if (groupId) {
          admin.database().ref('group-channel-members/' + groupId + '/' + channelId).set(snapChannel.val())
        }
      })
    })
  }
}

function copyRoles() {
  admin.database().ref('member-channels').once('value', function(snap) {
    snap.forEach(function(snapUser) {
      let userId = snapUser.key
      snapUser.forEach(function(snapGroup) {
        let groupId = snapGroup.key
        snapGroup.forEach(function(snapChannel) {
          let channelId = snapChannel.key
          let role = snapChannel.val().role
          let path = 'group-channel-members/' + groupId + '/' + channelId + '/' + userId + '/role'
          admin.database().ref(path).set(role)
            .then(function() {
              console.log('Synchronization succeeded')
              console.log(path + ' = ' + role)
            })
            .catch(function(error) {
              console.log('Synchronization failed', error)
            })
        })
      })
    })
  })
}

function scrubInstalls(install, results) {
  let index = 0
  results.forEach(function(result) {
    if (result.error && result.error === 'NotRegistered') {
      let installId = install.id
      let userId = install.userId
      console.log('Removed orphaned install for user: ' + userId + ': ' + installId)
      admin.database().ref('installs').child(userId).child(installId).remove()
    }
    index++
  })
}