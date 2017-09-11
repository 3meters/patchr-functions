/**
 * Common operations for test framework.
 */

exports.generateData = function generateData(exclude) {
  let data = {}
  let exclusions = exclude || {}
  if (!exclusions.clients) addClients(data)
  if (!exclusions.counters) addCounters(data)
  if (!exclusions.channelMembers) addChannelMembers(data)
  if (!exclusions.channels) addChannels(data)
  if (!exclusions.channelMessages) addChannelMessages(data)
  if (!exclusions.installs) addInstalls(data)
  if (!exclusions.invites) addInvites(data)
  if (!exclusions.memberChannels) addMemberChannels(data)
  if (!exclusions.messageComments) addMessageComments(data)
  if (!exclusions.tasks) addTasks(data)
  if (!exclusions.unreads) addUnreads(data)
  if (!exclusions.usernames) addUsernames(data)
  if (!exclusions.users) addUsers(data)
  return data
}

function addChannels(data) {
  data["channels"] = {
    "ch-generalxx": {
      "code": "abcdefghijkl",
      "created_at": 1481392125882,
      "created_by": "us-tarzanxxx",
      "general": true,
      "name": "chatter",
      "owned_by": "us-tarzanxxx",
    },
    "ch-chatterxx": {
      "code": "abcdefghijkl",
      "created_at": 1481392125882,
      "created_by": "us-tarzanxxx",
      "general": true,
      "name": "general",
      "owned_by": "us-tarzanxxx",
      "title": "General",
    },
    "ch-privatexx": {
      "code": "abcdefghijkl",
      "created_at": 1410520607434,
      "created_by": "us-janexxxxx",
      "general": false,
      "name": "birthday-surprise",
      "owned_by": "us-janexxxxx",
      "photo": {
        "filename": "us.140912.40308.863.812138_20140912_164642.jpg",
        "height": 1280,
        "source": "google-storage",
        "width": 960
      },
      "purpose": "Surprise party for Tarzan!",
      "title": "Birthday Surprise",
    },
  }
  return data
}

function addChannelMembers(data) {
  data["channel-members"] = {
    "ch-generalxx": {
      "us-tarzanxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-tarzanxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "owner",
        "starred": false
      },
      "us-janexxxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-janexxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "editor",
        "starred": false
      },
      "us-maryxxxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-maryxxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "editor",
        "starred": false
      }
    },
    "ch-chatterxx": {
      "us-tarzanxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125,
        "created_by": "us-tarzanxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "owner",
        "starred": false
      },
      "us-janexxxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-janexxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "editor",
        "starred": false
      }
    },
    "ch-privatexx": { // jane is channel.owned_by
      "us-janexxxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-janexxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "owner",
        "starred": false
      },
      "us-maryxxxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-maryxxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "owner",
        "starred": false
      },
      "us-tarzanxxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-tarzanxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "reader",
        "starred": false
      },
    }
  }
  return data
}

function addChannelMessages(data) {
  data["channel-messages"] = {
    "ch-generalxx": {
      "me-messagex1": {
        "attachments": {
          "at-attachxx1": {
            "photo": {
              "filename": "20151010_181726_0616_210973.jpg",
              "height": 768,
              "source": "google-storage",
              "width": 1024,
              "uploading": true,
              "taken_at": 1444526248003,
              "location": {
                "lat": 47.593649999999997,
                "lng": -122.15950833333333
              },
            }
          }
        },
        "channel_id": "ch-generalxx",
        "created_at": 1444526248003,
        "created_at_desc": -1444526248003,
        "created_by": "us-tarzanxxx",
        "modified_at": 1444526248033,
        "modified_by": "us-tarzanxxx",
        "text": "Hey, what do guy do to get banana?"
      }
    },
    "ch-privatexx": {
      "me-messagex1": {
        "channel_id": "ch-privatexx",
        "created_at": 1444526248003,
        "created_at_desc": -1444526248003,
        "created_by": "us-janexxxxx",
        "modified_at": 1444526248033,
        "modified_by": "us-janexxxxx",
        "text": "Maybe for Tarzan/'s birthday, we should give him that special night he always wanted.",
        "reactions": {
          ":thumbsup:": {
            "us-maryxxxxx": true
          }
        }
      }
    }
  }
  return data
}

function addClients(data) {
  data.clients = {
    "android": 134,
    "ios": 127
  }
  return data
}

function addCounters(data) {
  data.counters = {
    "us-tarzanxxx": {
      "unreads": 1
    },
    "us-maryxxxxx": {
      "unreads": 1
    }
  }
  return data
}

function addInstalls(data) {
  data.installs = {
    "us-tarzanxxx": {
      "cEnccVt3yGI:APA91bFgK0uQqpfozm63UmSmwLE0G0qNdwz_RE14QQbsiOOjoVYUfsCf5W8J3FwLjohxIPbAhsdH917zGu7zPFl3NIv9yE2isFE5SrUwqLfn8R36CaTn21lD4n28CvPTi4xkQct5v4cE": true
    },
    "us-janexxxxx": {
      "flx4y7jDocg:APA91bHf3RcgqKXoWp2NwMtMgcZND7PXaGas-OSxHYmBAjj1xVRYE4FZuGlgVDw4yeKrZJmVVX2NuIPSvCLNpHAS1GwKYHq5iqJc51MFivYqAKAiTrtqePGSe0WddQUZZfwdaHLYM823": true
    },
    "us-maryxxxxx": {
      "fBMkLMcA-UQ:APA91bGSVbmxYsNWh9WHM-PbrJ7n3juAA4dDKG41nJLTdREOrqwg5S3dBjuFPMNVBJQAx5ccZOF8h5dEtPn-uyzqBGk4KV1rMFxVWLbFr38mzCgku6DBwyncGnlXtgU6ybd6h7MEfFxo": true
    }
  }
  return data
}

function addInvites(data) {
  data.invites = {
    "in-treehous1": {
      "channel": {
        "id": "ch-privatexx",
        "title": "Birthday Surprise"
      },
      "created_at": 1484425797938,
      "created_by": "us-janexxxxx",
      "email": "mary@jungle.com",
      "inviter": {
        "email": "jane@jungle.com",
        "id": "us-janexxxxx",
        "title": "Jane Johnson-Smith",
        "username": "jane"
      },
      "link": "https://bvvb.app.link/X3Kj57ZbWz",
      "language": "en",
      "role": "reader",
    }
  }
  return data
}

function addMemberChannels(data) {
  data["member-channels"] = {
    "us-tarzanxxx": {
      "ch-generalxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125000,
        "created_by": "us-tarzanxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "role": "owner",
        "starred": false
      },
      "ch-chatterxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125,
        "created_by": "us-tarzanxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "role": "owner",
        "starred": false
      }
    },
    "us-janexxxxx": {
      "ch-generalxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125,
        "created_by": "us-janexxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "member",
        "starred": false
      },
      "ch-chatterxx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125,
        "created_by": "us-janexxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "member",
        "starred": false
      },
      "ch-privatexx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125,
        "created_by": "us-janexxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "owner",
        "starred": false
      }
    },
    "us-maryxxxxx": {
      "ch-privatexx": {
        "code": "abcdefghijkl",
        "created_at": 1481392125,
        "created_by": "us-maryxxxxx",
        "activity_at": 1481392125000,
        "activity_at_desc": -1481392125000,
        "activity_by": "us-tarzanxxx",
        "notifications": "all",
        "role": "member",
        "starred": false
      }
    }
  }
  return data
}

function addMessageComments(data) {
  data["message-comments"] = {
    "ch-generalxx": {
      "me-messagex1": {
        "co-commentx1": {
          "channel_id": "ch-generalxx",
          "created_at": 1444526248003,
          "created_at_desc": -1444526248003,
          "created_by": "us-janexxxxx",
          "message_id": "me-messagex1",
          "modified_at": 1444526248033,
          "modified_by": "us-janexxxxx",
          "text": "Reach up and shake branch dummy."
        }
      }
    },
    "ch-privatexx": {
      "me-messagex1": {
        "co-commentx1": {
          "channel_id": "ch-privatexx",
          "created_at": 1444526248003,
          "created_at_desc": -1444526248003,
          "created_by": "us-maryxxxxx",
          "message_id": "me-messagex1",
          "modified_at": 1444526248033,
          "modified_by": "us-maryxxxxx",
          "text": "I will make sure Cheeta is out for the night."
        }
      }
    },
  }
  return data
}

function addTasks(data) {
  data.tasks = {
    "create-user": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-cheetaxxx",
        "request": {
          "user_id": "us-cheetaxxx",
          "username": "cheeta",
        }
      }
    },
  }
  return data
}

function addUnreads(data) {
  data.unreads = {
    "us-janexxxxx": {
      "ch-generalxx": {
        "me-messagex1": true
      }
    },
    "us-maryxxxxx": {
      "ch-privatexx": {
        "me-messagex2": true
      }
    },
    "us-tarzanxxx": {
      "ch-privatexx": {
        "me-messagex2": true
      }
    }
  }
  return data
}

function addUsernames(data) {
  data.usernames = {
    "tarzan": "us-tarzanxxx",
    "jane": "us-janexxxxx",
    "mary": "us-maryxxxxx",
    "cheetasmokin": "us-cheetaxxx"
  }
  return data
}

function addUsers(data) {
  data.users = {
    "us-tarzanxxx": {
      "created_at": 1483921550852,
      "created_by": "us-tarzanxxx",
      "modified_at": 1483921550852,
      "presence": 1484513062961,
      "username": "tarzan",
      "profile": {
        "first_name": "Tarzan",
        "full_name": "Tarzan Johnson",
        "last_name": "Johnson",
        "photo": {
          "filename": "20161210_150029_0220_440133.jpg",
          "height": 958,
          "source": "google-storage",
          "width": 958
        }
      }
    },
    "us-janexxxxx": {
      "created_at": 1483921550852,
      "created_by": "us-janexxxxx",
      "modified_at": 1483921550852,
      "presence": 1484513062961,
      "username": "jane",
      "profile": {
        "first_name": "Jane",
        "full_name": "Jane Johnson-Smith",
        "last_name": "Johnson-Smith",
        "photo": {
          "filename": "20161210_150029_0220_440133.jpg",
          "height": 958,
          "source": "google-storage",
          "width": 958
        }
      }
    },
    "us-maryxxxxx": {
      "created_at": 1483921550852,
      "created_by": "us-maryxxxxx",
      "modified_at": 1483921550852,
      "presence": 1484513062961,
      "username": "mary",
      "profile": {
        "first_name": "Mary",
        "full_name": "Mary Stanley",
        "last_name": "Stanley"
      }
    }
  }
  return data
}

exports.users = {
  unauth: null,
  worker: {
    uid: 'patchr-cloud-worker',
    id: 1,
    provider: 'admin'
  },
  tarzan: {
    email: 'tarzan@treehouse.com',
    uid: 'us-tarzanxxx',
    id: 1,
    provider: 'password'
  },
  jane: {
    email: 'jane@treehouse.com',
    uid: 'us-janexxxxx',
    id: 1,
    provider: 'password'
  },
  mary: {
    email: 'mary@treehouse.com',
    uid: 'us-maryxxxxx',
    id: 1,
    provider: 'password'
  },
  cheeta: {
    email: 'cheeta@treehouse.com',
    uid: 'us-cheetaxxx',
    id: 1,
    provider: 'password'
  }
}