const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()
/* jshint -W117 */

chai.use(targaryen)
describe('Patchr v1.0 security rules', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Root security', function() {
    it('nobody but worker can read database root', function() {
      expect(users.unauth).cannot.read.path('/')
      expect(users.tarzan).cannot.read.path('/')
      expect(users.worker).can.read.path('/')
    })
    it('nobody but worker can write database root', function() {
      expect(users.unauth).cannot.write.path('/')
      expect(users.tarzan).cannot.write.path('/')
      expect(users.worker).can.write.path('/')
    })
  })
})