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
describe('Invites', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Invite writes', function() {

    var invite = {
      created_at: 1484425797938,
      created_by: "us-janexxxxx",
      email: "cheeta@jungle.com",
      group: {
        id: "gr-treehouse",
        title: "Treehouse"
      },
      invited_at: 1484425797938,
      invited_at_desc: -1484425797938,
      inviter: {
        email: "jane@jungle.com",
        id: "us-janexxxxx",
        title: "Jane Johnson-Smith",
        username: "jane"
      },
      link: "https://bvvb.app.link/X3Kj57ZbWz",
      role: "member",
      status: "pending"
    }

    /* All are from us-janexxxxx
     * in-treehous1: pending, guest, gr-treehouse, ch-privatexx
     * in-treehous2: accepted, guest, gr-treehouse, ch-privatexx
     * in-janetime1: pending, member, gr-janetimex
     * in-janetime2: accepted, member, gr-janetimex */

    let pathCreate = 'invites/gr-treehouse/us-janexxxxx/in-treehous6'
    let pathUpdate = 'invites/gr-treehouse/us-janexxxxx/in-treehous1'
    let pathDelete = 'invites/gr-treehouse/us-janexxxxx/in-treehous1'
    let pathDeleteAllForUser = 'invites/gr-treehouse/us-janexxxxx'
    let pathDeleteAllForGroup = 'invites/gr-treehouse'
    let pathStatusPending = 'invites/gr-treehouse/us-janexxxxx/in-treehous1/status'
    let pathStatusAccepted = 'invites/gr-treehouse/us-janexxxxx/in-treehous2/status'

    it('group member can create invite from them', function() {
      expect(users.tarzan).cannot.write(invite, 1484425797938).to.path(pathCreate)
      expect(users.unauth).cannot.write(invite, 1484425797938).to.path(pathCreate)
      expect(users.jane).can.write(invite, 1484425797938).to.path(pathCreate)
    })

    it('worker can create invite from jane to mary', function() {
      expect(users.worker).can.write(invite, 1484425797938).to.path(pathCreate)
    })

    it('only worker or jane can update invite status', function() {
      expect(users.cheeta).cannot.write("accepted").to.path(pathStatusPending)
      expect(users.tarzan).cannot.write("accepted").to.path(pathStatusPending)
      expect(users.worker).can.write("accepted").to.path(pathStatusPending)
      expect(users.jane).can.write("accepted").to.path(pathStatusPending)
    })

    it("only worker can revert jane's status for invite to mary to pending", function() {
      expect(users.cheeta).cannot.write("pending").to.path(pathStatusAccepted)
      expect(users.tarzan).cannot.write("pending").to.path(pathStatusAccepted)
      expect(users.jane).cannot.write("pending").to.path(pathStatusAccepted)
      expect(users.worker).can.write("pending").to.path(pathStatusAccepted)
    })

    it('only jane as the inviter can update the whole invite', function() {
      expect(users.tarzan).cannot.write(invite, 1484425797938).to.path(pathUpdate)
      expect(users.jane).can.write(invite, 1484425797938).to.path(pathUpdate)
    })

    it('only inviter or group owner can delete their invite', function() {
      expect(users.unauth).cannot.write(null).to.path(pathDelete)
      expect(users.tarzan).can.write(null).to.path(pathDelete) // group owner
      expect(users.jane).can.write(null).to.path(pathDelete) // invite owner
    })

    it('only inviter or group owner can delete all their invites', function() {
      expect(users.unauth).cannot.write(null).to.path(pathDeleteAllForUser)
      expect(users.tarzan).can.write(null).to.path(pathDeleteAllForUser) // group owner
      expect(users.jane).can.write(null).to.path(pathDeleteAllForUser) // invite owner
    })

    it('only group owner can delete all invites for group', function() {
      expect(users.unauth).cannot.write(null).to.path(pathDeleteAllForGroup)
      expect(users.tarzan).can.write(null).to.path(pathDeleteAllForGroup) // group primary owner (owned_by)
      expect(users.jane).can.write(null).to.path(pathDeleteAllForGroup) // group role owner
    })
  })

  describe('Invite reads', function() {
    it('only jane or worker can read her invites for a group', function() {
      expect(users.unauth).cannot.read.path(`invites/gr-treehouse/${users.jane.uid}`)
      expect(users.tarzan).can.read.path(`invites/gr-treehouse/${users.jane.uid}`) // group owner
      expect(users.worker).can.read.path(`invites/gr-treehouse/${users.jane.uid}`)
      expect(users.jane).can.read.path(`invites/gr-treehouse/${users.jane.uid}`)
    })
  })

})