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
describe('Queue deletes', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Queue group delete security', function() {
    const deleteTask = {
      created_at: 1481392125839,
      created_by: "us-tarzanxxx",
      group_id: "gr-treehouse",
      id: "ta-taskautokeyxxxxx2",
      state: "waiting",
      target: "group",
    }
    it('group owner can write group delete task to the deletes queue', function() {
      expect(users.tarzan).can.write(deleteTask).to.path('queue/deletes/ta-taskautokeyxxxxx2')
    })
    it('non group owner cannot write group delete task to the deletes queue', function() {
      let task = _.clone(deleteTask)
      task.created_by = "us-maryxxxxx"
      expect(users.mary).cannot.write(task).to.path('queue/deletes/ta-taskautokeyxxxxx2')
    })
    it('worker and task creator can remove delete task from the deletes queue', function() {
      expect(users.worker).can.write(null).to.path('queue/deletes/ta-taskautokeyxxxxx1')
      expect(users.tarzan).can.write(null).to.path('queue/deletes/ta-taskautokeyxxxxx1')
    })
  })

  describe('Queue channel delete security', function() {
    const deleteTask = {
      channel_id: "ch-privatexx",
      created_at: 1481392125839,
      created_by: "us-tarzanxxx",
      group_id: "gr-treehouse",
      id: "ta-taskautokeyxxxxx2",
      state: "waiting",
      target: "channel",
    }
    it('group owner can write channel delete task to the deletes queue', function() {
      expect(users.tarzan).can.write(deleteTask).to.path('queue/deletes/ta-taskautokeyxxxxx2') // group primary owner
    })
    it('channel owner can write channel delete task to the deletes queue', function() {
      let task = _.clone(deleteTask)
      task.created_by = "us-janexxxxx"
      expect(users.jane).can.write(task).to.path('queue/deletes/ta-taskautokeyxxxxx2') // channel primary and role owner
    })
    it('non group or channel owner cannot write channel delete task to the deletes queue', function() {
      let task = _.clone(deleteTask)
      task.created_by = "us-maryxxxxx"
      expect(users.mary).cannot.write(task).to.path('queue/deletes/ta-taskautokeyxxxxx2') // channel primary and role owner
    })
  })
})