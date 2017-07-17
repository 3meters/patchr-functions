const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const _ = require('lodash');
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

  /* Join: channel owners can add other group members including themselves
   * Join: group members can self join any public channel.
   * Join: using invite from channel member (may or may not already be group member).
   * Update: worker, owner and channel owner
   * Delete: worker, owner, and channel owner (as part of group/channel delete) */

  /* Group membership in data
   * us-tarzanxxx: gr-treehouse
   * us-janexxxxx: gr-treehouse
   * us-maryxxxxx: gr-janetimex
   * us-cheetaxxx: gr-janetimex */

  /* All invites are from us-janexxxxx
   * in-treehous1: pending, guest, gr-treehouse, ch-privatexx
   * in-treehous2: accepted, guest, gr-treehouse, ch-privatexx
   * in-treehous3: pending, member, gr-treehouse, ch-chatterxx
   * in-janetime1: pending, member, gr-janetimex
   * in-janetime2: accepted, member, gr-janetimex */

  describe('Channel membership writes', function() {

    let pathCheeta = `channel-members/ch-chatterxx/${users.cheeta.uid}` // Not treehouse member

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

    it('only worker, creator, owner (group or channel) can update channel membership', function() {
      const path = "channel-members/ch-generalxx/us-janexxxxx"
      expect(users.cheeta).cannot.write("none").to.path(path + "/notifications")
      expect(users.mary).cannot.write("none").to.path(path + "/notifications")
      expect(users.jane).can.write("none").to.path(path + "/notifications") // creator
      expect(users.tarzan).can.write("none").to.path(path + "/notifications") // channel owner
      expect(users.worker).can.write("none").to.path(path + "/notifications")
    })

    it('only worker and channel owner can update public channel role', function() {
      const path = "channel-members/ch-generalxx/us-maryxxxxx"
      expect(users.cheeta).cannot.write("owner").to.path(path + "/role")
      expect(users.mary).cannot.write("owner").to.path(path + "/role") // creator
      expect(users.jane).cannot.write("owner").to.path(path + "/role") 
      expect(users.tarzan).can.write("owner").to.path(path + "/role") // channel owner, group primary owner
      expect(users.worker).can.write("owner").to.path(path + "/role")
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
      expect(users.cheeta).cannot.read.path(path)
      expect(users.tarzan).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.mary).can.read.path(path)
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