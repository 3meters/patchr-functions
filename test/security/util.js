/**
 * Common operations for test framework.
 */

exports.generateData = function generateData(exclude) {
  let data = {}
  let exclusions = exclude || {}
  if (!exclusions.channelNames) addChannelNames(data)
  if (!exclusions.clients) addClients(data)
  if (!exclusions.counters) addCounters(data)
  if (!exclusions.groupChannelMembers) addGroupChannelMembers(data)
  if (!exclusions.groupChannels) addGroupChannels(data)
  if (!exclusions.groupMembers) addGroupMembers(data)
  if (!exclusions.groupMessages) addGroupMessages(data)
  if (!exclusions.groups) addGroups(data)
  if (!exclusions.installs) addInstalls(data)
  if (!exclusions.invites) addInvites(data)
  if (!exclusions.memberChannels) addMemberChannels(data)
  if (!exclusions.memberGroups) addMemberGroups(data)
  if (!exclusions.tasks) addTasks(data)
  if (!exclusions.typing) addTyping(data)
  if (!exclusions.unreads) addUnreads(data)
  if (!exclusions.usernames) addUsernames(data)
  if (!exclusions.users) addUsers(data)
  return data
}

function addChannelNames(data) {
  data["channel-names"] = {
    "gr-treehouse": {
      "general": "ch-generalxx",
      "chatter": "ch-chatterxx",
      "birthday-surprise": "ch-privatexx",
      "trips": "ch-tripsxxxx"
    },
    "gr-janetimex": {
      "general": "ch-generalxx",
      "chatter": "ch-chatterxx"
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

function addGroupChannelMembers(data) {
  data["group-channel-members"] = {
    "gr-treehouse": {
      "ch-generalxx": {
        "us-tarzanxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-tarzanxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "owner",
          "starred": false
        },
        "us-janexxxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-janexxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        },
        "us-maryxxxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-maryxxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        }
      },
      "ch-chatterxx": {
        "us-tarzanxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-tarzanxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "owner",
          "starred": false
        },
        "us-janexxxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-janexxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        }
      },
      "ch-privatexx": {
        "us-janexxxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-janexxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "owner",
          "starred": false
        },
        "us-maryxxxxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-maryxxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        }
      }
    }
  }
  return data
}

function addGroupChannels(data) {
  data["group-channels"] = {
    "gr-treehouse": {
      "ch-generalxx": {
        "archived": false,
        "created_at": 1481392125882,
        "created_by": "us-tarzanxxx",
        "general": true,
        "group_id": "gr-treehouse",
        "name": "chatter",
        "owned_by": "us-tarzanxxx",
        "purpose": "This channel is for messaging and announcements to the whole group. All group members are in this channel.",
        "type": "channel",
        "visibility": "open"
      },
      "ch-chatterxx": {
        "archived": false,
        "created_at": 1481392125882,
        "created_by": "us-tarzanxxx",
        "general": true,
        "group_id": "gr-treehouse",
        "name": "general",
        "owned_by": "us-tarzanxxx",
        "purpose": "The perfect place for crazy talk that you'd prefer to keep off the other channels.",
        "type": "channel",
        "visibility": "open"
      },
      "ch-privatexx": {
        "archived": false,
        "created_at": 1410520607434,
        "created_by": "us-janexxxxx",
        "general": false,
        "group_id": "gr-treehouse",
        "name": "birthday-surprise",
        "owned_by": "us-janexxxxx",
        "photo": {
          "filename": "us.140912.40308.863.812138_20140912_164642.jpg",
          "height": 1280,
          "source": "google-storage",
          "width": 960
        },
        "purpose": "Surprise party for Tarzan!",
        "type": "channel",
        "visibility": "private"
      }
    },
    "gr-janetimex": {
      "ch-generalxx": {
        "archived": false,
        "created_at": 1481392125882,
        "created_by": "us-janexxxxx",
        "general": true,
        "group_id": "gr-janetimex",
        "name": "general",
        "owned_by": "us-janexxxxx",
        "purpose": "This channel is for messaging and announcements to the whole group. All group members are in this channel.",
        "type": "channel",
        "visibility": "open"
      },
      "ch-chatterxx": {
        "archived": false,
        "created_at": 1481392125882,
        "created_by": "us-janexxxxx",
        "general": false,
        "group_id": "gr-janetimex",
        "name": "general",
        "owned_by": "us-janexxxxx",
        "purpose": "The perfect place for crazy talk that you'd prefer to keep off the other channels.",
        "type": "channel",
        "visibility": "open"
      }
    }
  }
  return data
}

function addGroupMembers(data) {
  data["group-members"] = {
    "gr-treehouse": {
      "us-tarzanxxx": {
        "created_at": 1481392125,
        "created_by": "us-tarzanxxx",
        "disabled": false,
        "email": "tarzan@jungle.com",
        "index_priority_joined_at": 41481392125,
        "index_priority_joined_at_desc": -61481392125,
        "joined_at": 1481392125,
        "joined_at_desc": -1481392125,
        "notifications": "all",
        "priority": 4,
        "role": "member"
      },
      "us-janexxxxx": {
        "created_at": 1481392125,
        "created_by": "us-janexxxxx",
        "disabled": false,
        "email": "jane@jungle.com",
        "index_priority_joined_at": 41481392125,
        "index_priority_joined_at_desc": -61481392125,
        "joined_at": 1481392125,
        "joined_at_desc": -1481392125,
        "notifications": "all",
        "priority": 4,
        "role": "owner"
      },
      "us-maryxxxxx": {
        "created_at": 1481392125839,
        "created_by": "us-maryxxxxx",
        "disabled": false,
        "email": "mary@jungle.com",
        "index_priority_joined_at": 41481392125839,
        "index_priority_joined_at_desc": -61481392125839,
        "joined_at": 1481392125839,
        "joined_at_desc": -1481392125839,
        "notifications": "all",
        "priority": 4,
        "role": "guest"
      }
    },
    "gr-janetimex": {
      "us-maryxxxxx": {
        "created_at": 1484416000,
        "created_by": "us-maryxxxxx",
        "disabled": false,
        "email": "jane@jungle.com",
        "index_priority_joined_at": 61484416000,
        "index_priority_joined_at_desc": -41484416000,
        "joined_at": 1484416000,
        "joined_at_desc": -1484416000,
        "notifications": "all",
        "priority": 6,
        "role": "member"
      },
      "us-cheetaxxx": {
        "created_at": 1484416000,
        "created_by": "us-cheetaxxx",
        "disabled": false,
        "email": "cheeta@jungle.com",
        "index_priority_joined_at": 61484416000,
        "index_priority_joined_at_desc": -41484416000,
        "joined_at": 1484416000,
        "joined_at_desc": -1484416000,
        "notifications": "all",
        "priority": 6,
        "role": "member"
      }
    }
  }
  return data
}

function addGroupMessages(data) {
  data["group-messages"] = {
    "gr-treehouse": {
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
          "group_id": "gr-treehouse",
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
          "group_id": "gr-treehouse",
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
  }
  return data
}

function addGroups(data) {
  data.groups = {
    "gr-treehouse": {
      "created_at": 1481392125839,
      "created_by": "us-tarzanxxx",
      "default_channels": ["ch-generalxx", "ch-chatterxx"],
      "modified_at": 1481392125839,
      "modified_by": "us-tarzanxxx",
      "owned_by": "us-tarzanxxx",
      "title": "Treehouse"
    },
    "gr-janetimex": {
      "created_at": 1481392125839,
      "created_by": "us-janexxxxx",
      "default_channels": ["ch-generalxx", "ch-chatterxx"],
      "modified_at": 1481392125839,
      "modified_by": "us-janexxxxx",
      "owned_by": "us-janexxxxx",
      "title": "Jane Time"
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
    "gr-treehouse": {
      "us-janexxxxx": {
        "in-treehous1": {
          "channel": {
            "id": "ch-privatexx",
            "name": "birthday-surprise"
          },
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "mary@jungle.com",
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "guest",
          "status": "pending"
        },
        "in-treehous2": {
          "accepted_at": 1484525797938,
          "accepted_by": "us-maryxxxxx",
          "channel": {
            "id": "ch-privatexx",
            "name": "birthday-surprise"
          },
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "cheeta@jungle.com",
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "guest",
          "status": "accepted"
        },
        "in-treehous3": {
          "channel": {
            "id": "ch-chatterxx",
            "name": "chatter"
          },
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "mary@jungle.com",
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "member",
          "status": "pending"
        },
        "in-treehous4": {
          "channel": {
            "id": "ch-privatexx",
            "name": "birthday-surprise"
          },
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "cheeta@jungle.com",
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "guest",
          "status": "pending"
        },
        "in-treehous5": {
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "cheeta@jungle.com",
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "member",
          "status": "pending"
        },
      },
      "us-tarzanxxx": {
        "in-treehous1": {
          "channel": {
            "id": "ch-privatexx",
            "name": "birthday-surprise"
          },
          "created_at": 1484425797938,
          "created_by": "us-tarzanxxx",
          "email": "cheeta@jungle.com",
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "tarzan@jungle.com",
            "id": "us-tarzanxxx",
            "title": "Tarzan",
            "username": "tarzan"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "guest",
          "status": "pending"
        },        
      }
    },
    "gr-janetimex": {
      "us-janexxxxx": {
        "in-janetime1": {
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "mary@jungle.com",
          "group": {
            "id": "gr-janetimex",
            "title": "Jane Time"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "member",
          "status": "pending"
        },
        "in-janetime2": {
          "created_at": 1484425797938,
          "created_by": "us-janexxxxx",
          "email": "mary@jungle.com",
          "group": {
            "id": "gr-janetimex",
            "title": "Jane Time"
          },
          "invited_at": 1484425797938,
          "invited_at_desc": -1484425797938,
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "role": "member",
          "status": "accepted"
        }
      }
    }
  }
  return data
}

function addMemberChannels(data) {
  data["member-channels"] = {
    "us-tarzanxxx": {
      "gr-treehouse": {
        "ch-generalxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-tarzanxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "owner",
          "starred": false
        },
        "ch-chatterxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-tarzanxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "owner",
          "starred": false
        }
      }
    },
    "us-janexxxxx": {
      "gr-treehouse": {
        "ch-generalxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-janexxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        },
        "ch-chatterxx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-janexxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        },
        "ch-privatexx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-janexxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "owner",
          "starred": false
        }
      }
    },
    "us-maryxxxxx": {
      "gr-treehouse": {
        "ch-privatexx": {
          "archived": false,
          "created_at": 1481392125,
          "created_by": "us-maryxxxxx",
          "index_priority_joined_at": 51484512896,
          "index_priority_joined_at_desc": -51484512896,
          "joined_at": 1484512896,
          "joined_at_desc": -1484512896,
          "muted": false,
          "priority": 5,
          "role": "member",
          "starred": false
        }
      }
    }
  }
  return data
}

function addMemberGroups(data) {
  data["member-groups"] = {
    "us-tarzanxxx": {
      "gr-treehouse": {
        "created_at": 1481392125,
        "created_by": "us-tarzanxxx",
        "disabled": false,
        "email": "tarzan@jungle.com",
        "index_priority_joined_at": 61484416000,
        "index_priority_joined_at_desc": -41484416000,
        "joined_at": 1484416000,
        "joined_at_desc": -1484416000,
        "notifications": "all",
        "priority": 6,
        "role": "owner"
      }
    },
    "us-janexxxxx": {
      "gr-treehouse": {
        "created_at": 1481392125,
        "created_by": "us-janexxxxx",
        "disabled": false,
        "email": "jane@jungle.com",
        "index_priority_joined_at": 61484416000,
        "index_priority_joined_at_desc": -41484416000,
        "joined_at": 1484416000,
        "joined_at_desc": -1484416000,
        "notifications": "all",
        "priority": 6,
        "role": "member"
      }
    },
    "us-maryxxxxx": {
      "gr-treehouse": {
        "created_at": 1484416000,
        "created_by": "us-maryxxxxx",
        "disabled": false,
        "email": "mary@jungle.com",
        "index_priority_joined_at": 61484416000,
        "index_priority_joined_at_desc": -41484416000,
        "joined_at": 1484416000,
        "joined_at_desc": -1484416000,
        "notifications": "all",
        "priority": 6,
        "role": "guest"
      },
      "gr-janetimex": {
        "created_at": 1484416000,
        "created_by": "us-maryxxxxx",
        "disabled": false,
        "email": "jane@jungle.com",
        "index_priority_joined_at": 61484416000,
        "index_priority_joined_at_desc": -41484416000,
        "joined_at": 1484416000,
        "joined_at_desc": -1484416000,
        "notifications": "all",
        "priority": 6,
        "role": "member"
      }
    }
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
    "clear-unreads": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-tarzanxxx",
        "request": {
          "channel_id": "ch-generalxx",
          "group_id": "gr-treehouse",
          "target": "channel",
        }
      }
    },
    "delete-group": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-tarzanxxx",
        "request": {
          "group_id": "gr-treehouse",
        }
      }
    },
    "delete-channel": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-tarzanxxx",
        "request": {
          "channel_id": "ch-chatterxx",
          "group_id": "gr-treehouse",
        }
      }
    },
    "join-group": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-tarzanxxx",
        "group_id": "gr-treehouse",
        "request": {
          "role": "member",
          "user_id": "us-cheetaxxx",
        }
      }
    },
    "create-invite": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-janexxxxx",
        "request": {
          "channels": {
            "ch-privatexx": "birthday-surprise",
          },
          "group": {
            "id": "gr-treehouse",
            "title": "Treehouse"
          },
          "invite_id": "in-treehous1",
          "inviter": {
            "email": "jane@jungle.com",
            "id": "us-janexxxxx",
            "title": "Jane Johnson-Smith",
            "username": "jane"
          },
          "link": "https://bvvb.app.link/X3Kj57ZbWz",
          "recipient": "mary@jungle.com",
          "type": "invite-guests",
        },
      }
    },
    "change-username": {
      "ta-taskautokeyxxxxx1": {
        "created_at": 1481392125839,
        "created_by": "us-cheetaxxx",
        "request": {
          "user_id": "us-cheetaxxx",
          "username": "cheetasmokin",
        }
      }
    },
  }
  return data
}

function addTyping(data) {
  data.typing = {
    "gr-treehouse": {
      "ch-generalxx": {
        "us-tarzanxxx": "tarzan"
      }
    }
  }
  return data
}

function addUnreads(data) {
  data.unreads = {
    "us-janexxxxx": {
      "gr-treehouse": {
        "ch-generalxx": {
          "me-messagex1": true
        }
      }
    },
    "us-maryxxxxx": {
      "gr-treehouse": {
        "ch-privatexx": {
          "me-messagex2": true
        }
      }
    },
    "us-tarzanxxx": {
      "gr-treehouse": {
        "ch-privatexx": {
          "me-messagex2": true
        }
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