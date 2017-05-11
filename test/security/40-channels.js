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
describe('Channels', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Channel writes', function() {

    const channelBase = {
      "archived": false,
      "created_at": 1410520607434,
      "created_by": "us-janexxxxx",
      "general": false,
      "group_id": "gr-treehouse",
      "name": "trip-planning",
      "owned_by": "us-janexxxxx",
      "photo": {
        "filename": "us.140912.40308.863.812138_20140912_164642.jpg",
        "height": 1280,
        "source": "aircandi.images",
        "width": 960
      },
      "purpose": "Making great trips",
      "type": "channel",
      "visibility": "open"
    }

    it('channel can only be created by group member or group owner', function() {
      const path = "group-channels/gr-treehouse/ch-tripsxxxx"
      expect(users.cheeta).cannot.write(channelBase, 1410520607434).to.path(path)
      expect(users.jane).can.write(channelBase, 1410520607434).to.path(path)
    })

    it('channel cannot be created with channel name used by another channel', function() {
      var channel = _.clone(channelBase)
      channel.name = "birthday-surprise"
      const path = "group-channels/gr-treehouse/ch-tripsxxxx"
      expect(users.jane).cannot.write(channel, 1410520607434).to.path(path)
    })

    it('channel can be created with pre-claimed channel name', function() {
      var channel = _.clone(channelBase)
      channel.name = "trips"
      const path = "group-channels/gr-treehouse/ch-tripsxxxx"
      expect(users.jane).can.write(channel, 1410520607434).to.path(path)
    })

    it('channel cannot be created by group guest', function() {
      const path = "group-channels/gr-treehouse/ch-tripsxxxx"
      expect(users.mary).cannot.write(channelBase, 1410520607434).to.path(path)
    })

    it('channel can only be updated by channel owner or worker', function() {
      const path = "group-channels/gr-treehouse/ch-privatexx"
      expect(users.cheeta).cannot.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
      expect(users.mary).cannot.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
      expect(users.worker).can.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
      expect(users.jane).can.write("Huge surprise party for Tarzan!").to.path(path + "/purpose")
    })

    it('channel can only be deleted by worker', function() {
      const path = "group-channels/gr-treehouse/ch-privatexx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.jane).cannot.write(null).to.path(path)
      expect(users.worker).can.write(null).to.path(path)
    })

    it('general channel cannot be deleted by anyone except worker', function() {
      const path = "group-channels/gr-treehouse/ch-generalxx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.tarzan).cannot.write(null).to.path(path)
      expect(users.jane).cannot.write(null).to.path(path)
      expect(users.worker).can.write(null).to.path(path)
    })
  })

  describe('Channel reads', function() {
    it('open channel can only be read by group members and worker', function() {
      const path = "group-channels/gr-treehouse/ch-generalxx"
      expect(users.unauth).cannot.read.path(path)
      expect(users.cheeta).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.mary).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.tarzan).can.read.path(path)      
    })

    it('private channel can only be read by group members and worker', function() {
      const path = "group-channels/gr-treehouse/ch-privatexx"
      expect(users.unauth).cannot.read.path(path)
      expect(users.cheeta).cannot.read.path(path)
      expect(users.tarzan).can.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.mary).can.read.path(path)
      expect(users.jane).can.read.path(path)
    })
  })
})