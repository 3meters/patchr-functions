const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
/* jshint -W117 */

chai.use(targaryen)
describe('Channel Membership', function() {

  before(function() {
    const exclude = {
      channelMembers: true,
      memberChannels: true,
    }
    let data = testUtil.generateData(exclude)
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  /* Channel membership in data
   * us-tarzanxxx: ch-generalxx (owner), ch-chatterxx (owner)
   * us-janexxxxx: ch-generalxx (editor), ch-chatterxx (editor), ch-privatexx (owner)
   * us-maryxxxxx: ch-generalxx (editor), ch-privatexx (reader) */

  describe('Channel membership writes', function() {

    let pathCheeta = `channel-members/ch-chatterxx/${users.cheeta.uid}` // Not chatter member

    it('can only join a channel using the channel code shared by the channel member', function() {
      let membership = membershipFrom(users.cheeta.uid, "editor", "zzcdefghijkl")
      expect(users.cheeta).cannot.write(membership, 1481392125839).to.path(pathCheeta)
      membership = membershipFrom(users.cheeta.uid, "editor", "abcdefghijkl")
      expect(users.cheeta).can.write(membership, 1481392125839).to.path(pathCheeta)
    })
  })

  describe('Channel membership updates and deletes', function() {

    before(function() {
      const data = testUtil.generateData()
      targaryen.setFirebaseData(data)
      targaryen.setFirebaseRules(rules)
    })

    it('only worker, creator, role owner can update channel membership', function() {
      const path = "channel-members/ch-generalxx/us-janexxxxx"
      expect(users.cheeta).cannot.write("none").to.path(path + "/notifications")
      expect(users.mary).cannot.write("none").to.path(path + "/notifications")
      expect(users.tarzan).cannot.write("none").to.path(path + "/notifications") // role owner, channel owner
      expect(users.jane).can.write("none").to.path(path + "/notifications") // creator
      expect(users.worker).can.write("none").to.path(path + "/notifications")
    })

    it('worker and role owner can update channel role', function() {
      const path = "channel-members/ch-generalxx/us-maryxxxxx"
      expect(users.cheeta).cannot.write("owner").to.path(path + "/role")
      expect(users.mary).cannot.write("owner").to.path(path + "/role") // creator
      expect(users.jane).cannot.write("owner").to.path(path + "/role") 
      expect(users.tarzan).can.write("owner").to.path(path + "/role") // channel owner
      expect(users.worker).can.write("owner").to.path(path + "/role")
    })

    it('channel owner or role owner can update channel role', function() {
      const path = "channel-members/ch-privatexx/us-tarzanxxx"
      expect(users.cheeta).cannot.write("editor").to.path(path + "/role") // no status
      expect(users.tarzan).cannot.write("editor").to.path(path + "/role") // role reader
      expect(users.mary).can.write("editor").to.path(path + "/role") // role owner
      expect(users.jane).can.write("editor").to.path(path + "/role") // channel owner
      expect(users.worker).can.write("editor").to.path(path + "/role")
    })

    it('channel owner cannot update role', function() {
      const path = "channel-members/ch-privatexx/us-janexxxxx"
      expect(users.cheeta).cannot.write("editor").to.path(path + "/role") // no status
      expect(users.tarzan).cannot.write("editor").to.path(path + "/role") // role reader
      expect(users.mary).cannot.write("editor").to.path(path + "/role") // role owner
      expect(users.jane).cannot.write("editor").to.path(path + "/role") // channel owner
      expect(users.worker).can.write("editor").to.path(path + "/role")
    })

    it('channel owner cannot delete membership', function() {
      const path = "channel-members/ch-privatexx/us-janexxxxx"
      expect(users.cheeta).cannot.write(null).to.path(path) // no status
      expect(users.tarzan).cannot.write(null).to.path(path) // role reader
      expect(users.mary).cannot.write(null).to.path(path) // role owner
      expect(users.jane).cannot.write(null).to.path(path) // channel owner
      expect(users.worker).can.write(null).to.path(path)
    })

    it('only worker, creator, or channel owner delete channel membership', function() {
      const path = "channel-members/ch-generalxx/us-janexxxxx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // creator
      expect(users.tarzan).can.write(null).to.path(path) // channel owner
      expect(users.worker).can.write(null).to.path(path)
    })
  })

  describe('Channel membership reads', function() {

    before(function() {
      const data = testUtil.generateData()
      targaryen.setFirebaseData(data)
      targaryen.setFirebaseRules(rules)
    })

    it('only user or worker can read their channel memberships', function() {
      const path = "member-channels/us-tarzanxxx"
      expect(users.jane).cannot.read.path(path)
      expect(users.tarzan).can.read.path(path)
      expect(users.worker).can.read.path(path)
    })

    it('only group member or worker can read user memberships for a public channel', function() {
      const path = "channel-members/ch-generalxx"
      expect(users.cheeta).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.tarzan).can.read.path(path)
    })

    it('only channel member or worker can read user memberships for a private channel', function() {
      const path = "channel-members/ch-privatexx"
      expect(users.cheeta).cannot.read.path(path) // no status
      expect(users.tarzan).can.read.path(path) // role reader
      expect(users.jane).can.read.path(path) // channel owner
      expect(users.mary).can.read.path(path) // role owner
      expect(users.worker).can.read.path(path)
    })
  })

  function membershipFrom(created_by, role, code) {
    let membership = {
      "code": code,
      "created_at": 1481392125839,
      "created_by": created_by,
      "activity_at": 1481392125839,
      "activity_at_desc": -1481392125839,
      "activity_by": created_by,
      "notifications": "all",
      "role": role,
      "starred": false,
    }
    return membership
  }
})