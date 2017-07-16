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
      channel: {
        id: "ch-generalxx",
        title: "General"
      },
      created_at: 1484425797938,
      created_by: "us-tarzanxxx",
      email: "cheeta@jungle.com",
      invited_at: 1484425797938,
      invited_at_desc: -1484425797938,
      inviter: {
        email: "tarzan@jungle.com",
        id: "us-tarzanxxx",
        title: "Tarzan Johnson-Smith",
        username: "tarzan"
      },
      link: "https://bvvb.app.link/X3Kj57ZbWz",
      role: "reader",
    }

    let pathCreate = 'invites/in-treehous6'
    let pathDelete = 'invites/in-treehous1'

    it('only channel owner or worker can create invite to channel', function() {
      expect(users.unauth).cannot.write(invite, 1484425797938).to.path(pathCreate)
      expect(users.jane).cannot.write(invite, 1484425797938).to.path(pathCreate)
      expect(users.worker).can.write(invite, 1484425797938).to.path(pathCreate)
      expect(users.tarzan).can.write(invite, 1484425797938).to.path(pathCreate)
    })

    it('only worker can delete an invite', function() {
      expect(users.unauth).cannot.write(null).to.path(pathDelete)
      expect(users.tarzan).cannot.write(null).to.path(pathDelete)
      expect(users.jane).cannot.write(null).to.path(pathDelete)
      expect(users.worker).can.write(null).to.path(pathDelete)
    })
  })

  describe('Invite reads', function() {
    let pathRead = 'invites/in-treehous1'
    it('only worker can read invites', function() {
      expect(users.unauth).cannot.read.path(pathRead)
      expect(users.jane).cannot.read.path(pathRead)
      expect(users.tarzan).cannot.read.path(pathRead)
      expect(users.worker).can.read.path(pathRead)
    })
  })

})