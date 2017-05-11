const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const _ = require('lodash');
/* jshint -W117 */

chai.use(targaryen)
describe('Channel Membership', function() {

  before(function() {
    const exclude = {
      groupChannelMembers: true,
      memberChannels: true,
    }
    let data = testUtil.generateData(exclude)
    delete data["group-members"]["gr-treehouse"]["us-maryxxxxx"]
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

  describe('Public channel membership writes', function() {

    let pathCheeta = `group-channel-members/gr-treehouse/ch-chatterxx/${users.cheeta.uid}` // Not treehouse member
    let pathJane = `group-channel-members/gr-treehouse/ch-chatterxx/${users.jane.uid}` // Treehouse member
    let pathTarzan = `group-channel-members/gr-treehouse/ch-chatterxx/${users.tarzan.uid}` // Treehouse member

    it('cheeta as non group member cannot join a public channel', function() {
      let membership = membershipFrom(users.cheeta.uid, "member")
      expect(users.cheeta).cannot.write(membership, 1481392125839).to.path(pathCheeta)
    })

    it('jane as group member can join a public channel', function() {
      let membership = membershipFrom(users.jane.uid, "member")
      expect(users.jane).can.write(membership, 1481392125839).to.path(pathJane)
    })

    it('tarzan as group member can join public channel using valid invite from jane', function() {
      let membership = membershipFrom(users.tarzan.uid, "member", "in-treehous3", "us-janexxxxx")
      expect(users.tarzan).can.write(membership, 1481392125839).to.path(pathTarzan)
    })
  })

  describe('Private channel membership writes', function() {

    let pathCheeta = `group-channel-members/gr-treehouse/ch-privatexx/${users.cheeta.uid}`
    let pathJane = `group-channel-members/gr-treehouse/ch-privatexx/${users.jane.uid}`
    let pathMary = `group-channel-members/gr-treehouse/ch-privatexx/${users.mary.uid}`

    it('cheeta cannot join a private channel without invite', function() {
      let membership = membershipFrom(users.cheeta.uid, "member")
      expect(users.cheeta).cannot.write(membership, 1481392125839).to.path(pathCheeta)
    })

    it('jane as channel primary owner can join without invite', function() {
      let membership = membershipFrom(users.jane.uid, "owner")
      expect(users.jane).can.write(membership, 1481392125839).to.path(pathJane)
    })

    it('mary cannot join private channel using invite to different channel', function() {
      let membership = membershipFrom(users.mary.uid, "member", "in-treehous3", "us-janexxxxx") // Invite to chatter
      expect(users.mary).cannot.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary cannot join private channel using invite that has already been used', function() {
      let membership = membershipFrom(users.mary.uid, "member", "in-treehous2", "us-janexxxxx")
      expect(users.mary).cannot.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary cannot join private channel as owner using invite', function() {
      let membership = membershipFrom(users.mary.uid, "owner", "in-treehous1", "us-janexxxxx")
      expect(users.mary).cannot.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary cannot join private channel using invite that does not exist', function() {
      let membership = membershipFrom(users.mary.uid, "member", "in-treehous9", "us-janexxxxx")
      expect(users.mary).cannot.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary can join private channel using valid invite from jane', function() {
      let membership = membershipFrom(users.mary.uid, "member", "in-treehous1", "us-janexxxxx")
      expect(users.mary).can.write(membership, 1481392125839).to.path(pathMary)
    })
  })

  describe('Channel membership updates and deletes', function() {

    before(function() {
      const data = testUtil.generateData()
      targaryen.setFirebaseData(data)
      targaryen.setFirebaseRules(rules)
    })

    it('only worker, creator, owner (group or channel) can update public channel membership', function() {
      const path = "group-channel-members/gr-treehouse/ch-generalxx/us-tarzanxxx"
      expect(users.cheeta).cannot.write(true).to.path(path + "/muted")
      expect(users.mary).cannot.write(true).to.path(path + "/muted")
      expect(users.jane).can.write(true).to.path(path + "/muted") // group role owner
      expect(users.tarzan).can.write(true).to.path(path + "/muted") // creator and channel owner (role and primary), group primary owner
      expect(users.worker).can.write(true).to.path(path + "/muted")
    })

    it('only worker and owner (group or channel) can update public channel role', function() {
      const path = "group-channel-members/gr-treehouse/ch-generalxx/us-maryxxxxx"
      expect(users.cheeta).cannot.write("owner").to.path(path + "/role")
      expect(users.mary).cannot.write("owner").to.path(path + "/role") // creator
      expect(users.jane).can.write("owner").to.path(path + "/role") // group role owner
      expect(users.tarzan).can.write("owner").to.path(path + "/role") // channel owner, group primary owner
      expect(users.worker).can.write("owner").to.path(path + "/role")
    })

    it('only worker, creator, owner (group or channel) can delete public channel membership', function() {
      const path = "group-channel-members/gr-treehouse/ch-generalxx/us-tarzanxxx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // group owner
      expect(users.tarzan).can.write(null).to.path(path) // creator and channel owner, group primary owner
      expect(users.worker).can.write(null).to.path(path)
    })

    it('only worker, creator or owner (group or channel) can update private channel membership', function() {
      const path = "group-channel-members/gr-treehouse/ch-privatexx/us-maryxxxxx"
      expect(users.cheeta).cannot.write(true).to.path(path + "/muted")
      expect(users.tarzan).can.write(true).to.path(path + "/muted") // group primary owner
      expect(users.mary).can.write(true).to.path(path + "/muted") // creator
      expect(users.jane).can.write(true).to.path(path + "/muted") // channel owner
      expect(users.worker).can.write(true).to.path(path + "/muted")
    })

    it('only worker and owner (group or channel) can update private channel role', function() {
      const path = "group-channel-members/gr-treehouse/ch-privatexx/us-maryxxxxx"
      expect(users.cheeta).cannot.write("owner").to.path(path + "/role")
      expect(users.mary).cannot.write("owner").to.path(path + "/role") // creator
      expect(users.jane).can.write("owner").to.path(path + "/role") // group role owner, channel owner (role and primary)
      expect(users.tarzan).can.write("owner").to.path(path + "/role") // group primary owner
      expect(users.worker).can.write("owner").to.path(path + "/role")
    })

    it('only worker, creator, owner (group or channel) can delete private channel membership', function() {
      const path = "group-channel-members/gr-treehouse/ch-privatexx/us-maryxxxxx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.tarzan).can.write(null).to.path(path) // group primary owner
      expect(users.mary).can.write(null).to.path(path) // creator
      expect(users.jane).can.write(null).to.path(path) // group owner, channel owner (role and primary)
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
      const path = "group-channel-members/gr-treehouse/ch-generalxx"
      expect(users.cheeta).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.tarzan).can.read.path(path)
    })

    it('only channel member or worker can read user memberships for a private channel', function() {
      const path = "group-channel-members/gr-treehouse/ch-privatexx"
      expect(users.cheeta).cannot.read.path(path)
      expect(users.tarzan).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.mary).can.read.path(path)
    })
  })

  function membershipFrom(created_by, role, invite_id, invited_by) {
    let membership = {
      "archived": false,
      "created_at": 1481392125839,
      "created_by": created_by,
      "index_priority_joined_at": 41481392125,
      "index_priority_joined_at_desc": -41481392125,
      "joined_at": 1481392125,
      "joined_at_desc": -1481392125,
      "muted": false,
      "priority": 4,
      "role": role,
      "starred": false,
    }
    if (invite_id) {
      membership.invite_id = invite_id
    }
    if (invited_by) {
      membership.invited_by = invited_by
    }
    return membership
  }
})