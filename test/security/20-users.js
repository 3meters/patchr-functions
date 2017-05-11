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
describe('Users', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('User writes', function() {

    const userBase = {
      created_at: 1483921550852,
      created_by: "us-cheetaxxx",
      modified_at: 1483921550852,
      username: "cheeta"
    }

    it('only worker can create users', function() {
      expect(users.cheeta).cannot.write(userBase).to.path("users/us-cheetaxxx")
      expect(users.worker).can.write(userBase).to.path("users/us-cheetaxxx")
    })

    it('user cannot be created with username used by another user', function() {
      var user = _.clone(userBase)
      user.username = "mary"
      expect(users.worker).cannot.write(user).to.path("users/us-cheetaxxx")
    })

    it('user can be created with pre-claimed username', function() {
      var user = _.clone(userBase)
      user.username = "cheetasmokin"
      expect(users.worker).can.write(user).to.path("users/us-cheetaxxx")
    })

    it('user cannot be created without required keys', function() {
      var user = _.clone(userBase)
      delete user.username
      expect(users.worker).cannot.write(user).to.path("users/us-cheetaxxx")
    })

    it('user cannot be created with unknown key', function() {
      var user_stealin = _.clone(userBase)
      user_stealin.porn_blob = "I/'m stealing your storage for my base64 encoded porn images"
      expect(users.worker).cannot.write(user_stealin).to.path("users/us-cheetaxxx")
    })

    it('user cannot be created with garbage data', function() {
      var user_username_short = _.clone(userBase)
      var user_username_long = _.clone(userBase)
      var user_username_mixed_case = _.clone(userBase)

      user_username_short.username = "c"
      user_username_long.username = "cheetaisasuperbigbanana"
      user_username_mixed_case.username = "Cheeta"

      expect(users.worker).cannot.write(user_username_short).to.path("users/us-cheetaxxx")
      expect(users.worker).cannot.write(user_username_long).to.path("users/us-cheetaxxx")
      expect(users.worker).cannot.write(user_username_mixed_case).to.path("users/us-cheetaxxx")
    })

    it('user profile can only be updated by creator or worker', function() {
      expect(users.worker).can.write("shithead").to.path("users/us-tarzanxxx/profile/first_name")
      expect(users.cheeta).cannot.write("hobbit").to.path("users/us-tarzanxxx/profile/first_name")
      expect(users.tarzan).can.write("swinger").to.path("users/us-tarzanxxx/profile/first_name")
    })

    it('user presence can only be updated by creator or worker', function() {
      expect(users.worker).can.write(true).to.path("users/us-tarzanxxx/presence")
      expect(users.cheeta).cannot.write(true).to.path("users/us-tarzanxxx/presence")
      expect(users.tarzan).can.write(true).to.path("users/us-tarzanxxx/presence")
    })


    it('user can only be deleted by worker', function() {
      expect(users.worker).can.write(null).to.path("users/us-tarzanxxx")
      expect(users.cheeta).cannot.write(null).to.path("users/us-tarzanxxx")
      expect(users.tarzan).cannot.write(null).to.path("users/us-tarzanxxx")
    })
  })

  describe('User reads', function() {
    it('user can only be read by authenticated user or worker', function() {
      expect(users.unauth).cannot.read.path("users/us-tarzanxxx")      
      expect(users.cheeta).can.read.path("users/us-tarzanxxx")      
      expect(users.worker).can.read.path("users/us-tarzanxxx")      
    })
  })
})