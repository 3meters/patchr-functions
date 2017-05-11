const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()
const _ = require('lodash')

/* jshint -W117 */

chai.use(targaryen)
describe('Queue misc', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Queue general security', function() {
    it('only worker can read the queue root', function() {
      expect(users.unauth).cannot.read.path('queue')
      expect(users.tarzan).cannot.read.path('queue')
      expect(users.jane).cannot.read.path('queue')
      expect(users.worker).can.read.path('queue')
    })
    it('only worker can read the queue', function() {
      expect(users.unauth).cannot.read.path('queue')
      expect(users.tarzan).cannot.read.path('queue')
      expect(users.jane).cannot.read.path('queue')
      expect(users.worker).can.read.path('queue')
    })
  })

  describe('Queue invites security', function() {
    var inviteTask = {
      created_at: 1481392125839,
      created_by: "us-janexxxxx",
      group: {
        id: "gr-treehouse",
        title: "Treehouse"
      },
      id: "ta-taskautokeyxxxxx2",
      inviter: {
        email: "jane@jungle.com",
        id: "us-janexxxxx",
        title: "Jane Johnson-Smith",
        username: "jane"
      },
      invite_id: "in-invitexx8",
      link: "https://bvvb.app.link/X3Kj57ZbWz",
      recipient: "mary@jungle.com",
      state: "waiting",
      type: "invite-guests",
    }
    it('non group member cannot write group invite task to the invites queue', function() {
      let task = _.clone(inviteTask)
      task.created_by = "us-cheetaxxx"
      expect(users.cheeta).cannot.write(task).to.path('queue/invites/ta-taskautokeyxxxxx2')
    })
    it('only inviter can write invite task to the invites queue', function() {
      let task = _.clone(inviteTask)
      task.created_by = "us-tarzanxxx"
      expect(users.tarzan).cannot.write(task).to.path('queue/invites/ta-taskautokeyxxxxx2')
      expect(users.jane).can.write(inviteTask).to.path('queue/invites/ta-taskautokeyxxxxx2')
    })
    it('only task where state == waiting can be added to the invites queue', function() {
      let task = _.clone(inviteTask)
      task.state = "processing"
      expect(users.jane).cannot.write(task).to.path('queue/invites/ta-taskautokeyxxxxx2')
    })
    it('worker and task creator can remove invite task from the invites queue', function() {
      expect(users.jane).can.write(null).to.path('queue/invites/ta-taskautokeyxxxxx1')
      expect(users.worker).can.write(null).to.path('queue/invites/ta-taskautokeyxxxxx1')
    })
  })

  describe('Queue notifications security', function() {
    let task = {
      channel_id: "ch-generalxx",
      channelName: "general",
      created_at: 1444526248003,
      created_by: "us-tarzanxxx",
      group_id: "gr-treehouse",
      id: "ta-taskautokeyxxxxx2",
      username: "tarazn",
      state: "waiting",
      text: "Hey, where are my bananas?",
      photo: {
        "filename": "20170209_095635_0110_270471.jpg",
        "height": 768,
        "source": "aircandi.images",
        "width": 1024,
        "uploading": true,
        "taken_at": 1444526248003,
        "location": {
          "lat": 47.593649999999997,
          "lng": -122.15950833333333,
        },
      }
    }
    it('non group member cannot write notification task to the queue', function() {
      expect(users.cheeta).cannot.write(task).to.path('queue/notifications/ta-taskautokeyxxxxx2')
    })
    it('only creator and group member can write notification task to the notifications queue', function() {
      expect(users.tarzan).can.write(task).to.path('queue/notifications/ta-taskautokeyxxxxx2')
      expect(users.jane).cannot.write(task).to.path('queue/notifications/ta-taskautokeyxxxxx2')
    })
    it('worker can remove invite task from the invites queue', function() {
      expect(users.worker).can.write(null).to.path('queue/notifications/ta-taskautokeyxxxxx1')
    })
  })
})