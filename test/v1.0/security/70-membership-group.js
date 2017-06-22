const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const _ = require('lodash');
/* jshint -W117 */

chai.use(targaryen)

describe('Group Membership', function() {

  before(function() {
    const exclude = {
      groupChannelMembers: true,
      groupMembers: true,
      memberChannels: true,
      memberGroups: true,
    }
    const data = testUtil.generateData(exclude)
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  /* Join: only using invite from a group member.
   * Join: group primary owner can self join without an invite. 
   * Update: worker, owner and group owner
   * Delete: worker, owner and group owner (as part of group delete) */

  /* All invites are from us-janexxxxx
   * in-treehous1: pending, guest, gr-treehouse, ch-privatexx
   * in-treehous2: accepted, guest, gr-treehouse, ch-privatexx
   * in-janetime1: pending, member, gr-janetimex
   * in-janetime2: accepted, member, gr-janetimex */

  let pathJane = "group-members/gr-janetimex/us-janexxxxx"
  let pathMary = "group-members/gr-janetimex/us-maryxxxxx"
  let pathCheeta = "group-members/gr-treehouse/us-cheetaxxx"

  describe('Group membership writes', function() {

    it('jane as group owner can add herself to janetime as a member without invite', function() {
      let membership = membershipFrom("us-janexxxxx", "member", "jane@jungle.com")
      expect(users.tarzan).cannot.write(membership, 1481392125839).to.path(pathJane)
      expect(users.cheeta).cannot.write(membership, 1481392125839).to.path(pathJane)
      expect(users.jane).can.write(membership, 1481392125839).to.path(pathJane)
    })

    it('cheeta cannot join treehouse using invite to janetime', function() {
      let membership = membershipFrom("us-cheetaxxx", "member", "cheeta@jungle.com", "in-janetime1", "us-janexxxxx")
      expect(users.cheeta).cannot.write(membership, 1481392125839).to.path(pathCheeta)
    })

    it('mary can join janetime using invite that has already been used', function() {
      let membership = membershipFrom("us-cheetaxxx", "member", "mary@jungle.com", "in-janetime2", "us-janexxxxx")
      expect(users.mary).can.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary cannot join janetime using invite with wrong role', function() {
      let membership = membershipFrom("us-maryxxxxx", "owner", "mary@jungle.com", "in-janetime1", "us-janexxxxx")
      expect(users.mary).cannot.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary cannot join janetime using invite that does not exist', function() {
      let membership = membershipFrom("us-maryxxxxx", "member", "mary@jungle.com", "in-treehous9", "us-janexxxxx")
      expect(users.mary).cannot.write(membership, 1481392125839).to.path(pathMary)
    })

    it('mary can join janetime using valid invite', function() {
      let membership = membershipFrom("us-maryxxxxx", "member", "mary@jungle.com", "in-janetime1", "us-janexxxxx")
      expect(users.mary).can.write(membership, 1481392125839).to.path(pathMary)
    })
  })

  describe('Group membership updates and deletes', function() {

    before(function() {
      const data = testUtil.generateData()
      targaryen.setFirebaseData(data)
      targaryen.setFirebaseRules(rules)
    })

    it('only worker, creator, group owner role can update membership', function() {
      const path = "group-members/gr-treehouse/us-tarzanxxx"
      expect(users.cheeta).cannot.write("tarzan@gmail.com").to.path(path + "/email")
      expect(users.mary).cannot.write("tarzan@gmail.com").to.path(path + "/email")
      expect(users.jane).can.write(true).to.path(path + "/disabled") // group owner role
      expect(users.tarzan).can.write("tarzan@gmail.com").to.path(path + "/email") // creator
      expect(users.worker).can.write("tarzan@gmail.com").to.path(path + "/email")
    })

    it('only worker, creator, group owner role can update membership', function() {
      const path = "group-members/gr-treehouse/us-tarzanxxx"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // group owner role
      expect(users.tarzan).can.write(null).to.path(path) // creator
      expect(users.worker).can.write(null).to.path(path)
    })
  })

  describe('Group membership reads', function() {

    before(function() {
      const data = testUtil.generateData()
      targaryen.setFirebaseData(data)
      targaryen.setFirebaseRules(rules)
    })

    it('only user or worker can read their group memberships', function() {
      const path = "member-groups/us-tarzanxxx"
      expect(users.jane).cannot.read.path(path)
      expect(users.tarzan).can.read.path(path)
      expect(users.worker).can.read.path(path)
    })

    it('only group member or worker can read user memberships for the group', function() {
      const path = "group-members/gr-treehouse"
      expect(users.cheeta).cannot.read.path(path)
      expect(users.mary).can.read.path(path) // guest
      expect(users.worker).can.read.path(path)
      expect(users.jane).can.read.path(path) // member
      expect(users.tarzan).can.read.path(path) // owner
    })

    it('group guest can read user memberships for the group', function() {
      const path = "group-members/gr-treehouse"
      expect(users.mary).can.read.path(path)
    })
  })

  function membershipFrom(created_by, role, email, invite_id, invited_by) {
    let membership = {
      "created_at": 1481392125839,
      "created_by": created_by,
      "disabled": false,
      "index_priority_joined_at": 41481392125,
      "index_priority_joined_at_desc": -41481392125,
      "joined_at": 1481392125,
      "joined_at_desc": -1481392125,
      "notifications": "all",
      "priority": 4,
      "role": role
    }
    if (email) {
      membership.email = email
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