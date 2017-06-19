const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()
const _ = require('lodash')

/* jshint -W117 */

chai.use(targaryen)
describe('Tasks create', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('User create security', function() {

    var task = {
      created_at: 1481392125839,
      created_by: "us-cheetaxxx",
      request: {
        user_id: "us-cheetaxxx",
        username: "cheeta",
      }
    }
    it('only authenticated user can write create user task to the tasks', function() {
      let path = 'tasks/create-user/ta-taskautokeyxxxxx2'
      expect(users.unauth).cannot.write(task).to.path(path)
      expect(users.cheeta).can.write(task).to.path(path)
    })
    it('only task creator can observe task in the lookup tasks', function() {
      let path = 'tasks/create-user/ta-taskautokeyxxxxx1'
      expect(users.tarzan).cannot.read.path(path)
      expect(users.cheeta).can.read.path(path)
    })
    it('only task creator can delete task from the lookup tasks', function() {
      let path = 'tasks/create-user/ta-taskautokeyxxxxx1'
      expect(users.tarzan).cannot.write(null).to.path(path)
      expect(users.cheeta).can.write(null).to.path(path)
    })
  })
})