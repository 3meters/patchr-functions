const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()
const _ = require('lodash');

/* jshint -W117 */

chai.use(targaryen)
describe('Channels', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Channel writes', function() {

    const channelBase = {
      "code": "abcdejghijkl",
      "created_at": 1410520607434,
      "created_by": "us-janexxxxx",
      "general": false,
      "name": "trip-planning",
      "owned_by": "us-janexxxxx",
      "photo": {
        "filename": "us.140912.40308.863.812138_20140912_164642.jpg",
        "height": 1280,
        "source": "google-storage",
        "width": 960
      },
      "purpose": "Making great trips",
      "title": "Trip Planning"
    }

    it('channel can only be created by authenticated user', function() {
      const path = "channels/ch-tripsxxxx"
      expect(users.unauth).cannot.write(channelBase, 1410520607434).to.path(path)
      expect(users.jane).can.write(channelBase, 1410520607434).to.path(path)
    })

    it('channel can only be updated by channel owner or worker', function() {
      const path = "channels/ch-privatexx"
      expect(users.cheeta).cannot.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
      expect(users.mary).cannot.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
      expect(users.worker).can.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
      expect(users.jane).can.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
    })

    it('channel can only be deleted by owner, creator or worker', function() {
      const path = "channels/ch-privatexx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // Channel creator and owner
      expect(users.worker).can.write(null).to.path(path)
    })

    it('general channel cannot be deleted by anyone except owner, creator or worker', function() {
      const path = "channels/ch-generalxx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.jane).cannot.write(null).to.path(path) // Channel member
      expect(users.tarzan).can.write(null).to.path(path) // Channel creator and owner
      expect(users.worker).can.write(null).to.path(path)
    })
  })

  describe('Channel reads', function() {
    it('channel can only be read by channel members and worker', function() {
      const path = "channels/ch-generalxx"
      expect(users.unauth).cannot.read.path(path)
      expect(users.cheeta).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.mary).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.tarzan).can.read.path(path)      
    })
  })
})