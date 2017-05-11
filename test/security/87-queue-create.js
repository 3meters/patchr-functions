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
describe('Queue create', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('User create security', function() {

    var task = {
      created_at: 1481392125839,
      created_by: "us-cheetaxxx",
      user_id: "us-cheetaxxx",
      username: "cheeta",
      id: "ta-taskautokeyxxxxx2",
      retain: true,
      state: "waiting",
    }
    it('only authenticated user can write create user task to the queue', function() {
      let path = 'queue/create-user/ta-taskautokeyxxxxx2'
      expect(users.unauth).cannot.write(task).to.path(path)
      expect(users.cheeta).can.write(task).to.path(path)
    })
    it('only task creator can observe task in the lookup queue', function() {
      let path = 'queue/create-user/ta-taskautokeyxxxxx1'
      expect(users.tarzan).cannot.read.path(path)
      expect(users.cheeta).can.read.path(path)
    })
    it('only task creator can delete task from the lookup queue', function() {
      let path = 'queue/create-user/ta-taskautokeyxxxxx1'
      expect(users.tarzan).cannot.write(null).to.path(path)
      expect(users.cheeta).can.write(null).to.path(path)
    })
  })

  describe('User update username security', function() {

    var task = {
      created_at: 1481392125839,
      created_by: "us-cheetaxxx",
      user_id: "us-cheetaxxx",
      username: "cheetasmokin",
      id: "ta-taskautokeyxxxxx2",
      retain: true,
      state: "waiting",
    }
    it('only authenticated user can write create user task to the queue', function() {
      let path = 'queue/update-username/ta-taskautokeyxxxxx2'
      expect(users.unauth).cannot.write(task).to.path(path)
      expect(users.cheeta).can.write(task).to.path(path)
    })
    it('only task creator can observe task in the lookup queue', function() {
      let path = 'queue/update-username/ta-taskautokeyxxxxx1'
      expect(users.tarzan).cannot.read.path(path)
      expect(users.cheeta).can.read.path(path)
    })
    it('only task creator can delete task from the lookup queue', function() {
      let path = 'queue/update-username/ta-taskautokeyxxxxx1'
      expect(users.tarzan).cannot.write(null).to.path(path)
      expect(users.cheeta).can.write(null).to.path(path)
    })
  })
})