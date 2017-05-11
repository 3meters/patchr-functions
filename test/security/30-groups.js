const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()
const _ = require('lodash');
/* jshint -W117 */

chai.use(targaryen)
describe('Groups', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Group writes', function() {

    const group = {
      "created_at": 1481392125839,
      "created_by": "us-janexxxxx",
      "default_channels": ["ch-generalxx", "ch-chatterxx"],
      "modified_at": 1481392125839,
      "modified_by": "us-janexxxxx",
      "owned_by": "us-janexxxxx",
      "title": "Treehouse"
    }

    it('group cannot be created without required keys', function() {
      var group_invalid = _.clone(group)
      delete group_invalid.title
      expect(users.jane).cannot.write(group_invalid).to.path("groups/gr-riverbank")
    })

    it('group cannot be created with unknown key', function() {
      var group_stealin = _.clone(group)
      group_stealin.porn_blob = "I/'m stealing your storage for my base64 encoded porn images"
      expect(users.jane).cannot.write(group_stealin).to.path("groups/gr-riverbank")
    })

    it('group cannot be created with garbage data', function() {
      var group_bad_key = _.clone(group)
      var group_bad_default_channels = _.clone(group)
      var group_bad_title = _.clone(group)
      var group_bad_photo = _.clone(group)

      group_bad_key.created_by = "reallybadlyformedkeythatshouldberejected"
      group_bad_default_channels = 100
      group_bad_title.title = new Array(300).join("x")
      group_bad_photo = {
        filename: "blahblahgrrrrrr"
      }

      expect(users.jane).cannot.write(group_bad_key).to.path("groups/gr-riverbank")
      expect(users.jane).cannot.write(group_bad_default_channels).to.path("groups/gr-riverbank")
      expect(users.jane).cannot.write(group_bad_title).to.path("groups/gr-riverbank")
      expect(users.jane).cannot.write(group_bad_photo).to.path("groups/gr-riverbank")
    })

    it('group cannot be created if current user is not primary owner', function() {
      expect(users.tarzan).cannot.write(group, 1481392125839).to.path("groups/gr-riverbank")
    })

    it('group can only be created by current authenticated user', function() {
      expect(users.jane).can.write(group, 1481392125839).to.path("groups/gr-riverbank")
    })

    it('group can only be updated by group owner or worker', function() {
      expect(users.mary).cannot.write("OK Treehouse").to.path("groups/gr-treehouse/title")
      expect(users.worker).can.write("OK Treehouse").to.path("groups/gr-treehouse/title")
      expect(users.tarzan).can.write("Best Treehouse").to.path("groups/gr-treehouse/title")
      expect(users.jane).can.write("Super Best Treehouse").to.path("groups/gr-treehouse/title")
    })

    it('group can only be deleted by worker', function() {
      expect(users.mary).cannot.write(null).to.path("groups/gr-treehouse")
      expect(users.tarzan).cannot.write(null).to.path("groups/gr-treehouse")
      expect(users.jane).cannot.write(null).to.path("groups/gr-treehouse")
      expect(users.worker).can.write(null).to.path("groups/gr-treehouse")
    })
  })

  describe('Group reads', function() {
    it('group can only be read by group members', function() {
      expect(users.unauth).cannot.read.path("groups/gr-treehouse")
      expect(users.cheeta).cannot.read.path("groups/gr-treehouse")
      expect(users.worker).can.read.path("groups/gr-treehouse")
      expect(users.mary).can.read.path("groups/gr-treehouse")
      expect(users.jane).can.read.path("groups/gr-treehouse")
      expect(users.tarzan).can.read.path("groups/gr-treehouse")      
    })
  })
})