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
describe('Queue joins', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Queue group join security', function() {
    const joinGroupTask = {
      created_at: 1481392125839,
      created_by: "us-tarzanxxx",
      group_id: "gr-treehouse",
      id: "ta-taskautokeyxxxxx2",
      retain: true,
      role: "member",
      state: "waiting",
      user_id: "us-cheetaxxx",
    }
    const joinChannelTask = {
      channels: {"ch-privatexx": "birthday-surprise"},
      created_at: 1481392125839,
      created_by: "us-tarzanxxx",
      group_id: "gr-treehouse",      
      id: "ta-taskautokeyxxxxx2",
      retain: true,
      role: "guest",
      state: "waiting",
      user_id: "us-cheetaxxx",
    }
    it('group owner can add member join task to the join-group queue', function() {
      expect(users.tarzan).can.write(joinGroupTask).to.path('queue/join-group/ta-taskautokeyxxxxx2')
    })
    it('group owner can add guest join task to the join-group queue', function() {
      expect(users.tarzan).can.write(joinChannelTask).to.path('queue/join-group/ta-taskautokeyxxxxx2')
    })
    it('user with valid invite can add member join task for themselves to the join-group queue', function() {
      let task = _.clone(joinGroupTask)
      task.created_by = "us-cheetaxxx"
      task.invite_id = "in-treehous5"
      task.invited_by = "us-janexxxxx"
      expect(users.cheeta).can.write(task).to.path('queue/join-group/ta-taskautokeyxxxxx2')
    })
    it('user with valid invite can add guest join task for themselves to the join-group queue', function() {
      let task = _.clone(joinChannelTask)
      task.created_by = "us-cheetaxxx"
      task.invite_id = "in-treehous4"
      task.invited_by = "us-janexxxxx"
      expect(users.cheeta).can.write(task).to.path('queue/join-group/ta-taskautokeyxxxxx2')
    })

    it('only worker and task creator can remove join task from the join queue', function() {
      expect(users.mary).cannot.write(null).to.path('queue/join-group/ta-taskautokeyxxxxx1')
      expect(users.jane).cannot.write(null).to.path('queue/join-group/ta-taskautokeyxxxxx1')
      expect(users.worker).can.write(null).to.path('queue/join-group/ta-taskautokeyxxxxx1')
      expect(users.tarzan).can.write(null).to.path('queue/join-group/ta-taskautokeyxxxxx1')
    })

  })
})