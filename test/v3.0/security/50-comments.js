const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()

/* jshint -W117 */

chai.use(targaryen)
describe('Comments', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Comment writes', function() {

    const comment = {
      "channel_id": "ch-generalxx",
      "created_at": 1444526248003,
      "created_at_desc": -1444526248003,
      "created_by": "us-janexxxxx",
      "message_id": "-KrWb-uWAFkrKQAS4NA8",
      "modified_at": 1444526248003,
      "modified_by": "us-janexxxxx",
      "text": "Eat this."
    }

    it('comments can created by any channel member', function() {
      const path = "message-comments/ch-generalxx/me-messagex1/co-commentx2"
      expect(users.cheeta).cannot.write(comment, 1444526248003).to.path(path)
      expect(users.tarzan).can.write(comment, 1444526248003).to.path(path)
      expect(users.jane).can.write(comment, 1444526248003).to.path(path)
      expect(users.mary).can.write(comment, 1444526248003).to.path(path)
    })

    // it('comments can only be updated by comment creator', function() {
    //   const path = "message-comments/ch-generalxx/me-messagex1/co-commentx1"
    //   const text = "Hey, what does a guy have to do to get a banana around here?"
    //   expect(users.cheeta).cannot.write(text).to.path(path + "/text")
    //   expect(users.tarzan).cannot.write(text).to.path(path + "/text")
    //   expect(users.jane).can.write(text).to.path(path + "/text")
    // })

    // it('comment can only be deleted by comment creator or channel owner', function() {
    //   const path = "message-comments/ch-generalxx/me-messagex1/co-commentx1"
    //   expect(users.cheeta).cannot.write(null).to.path(path)
    //   expect(users.mary).cannot.write(null).to.path(path)
    //   expect(users.jane).can.write(null).to.path(path)
    //   expect(users.tarzan).can.write(null).to.path(path)
    // })
  })

  describe('Comment reactions', function() {

    it('mary can like and unlike her own comment', function() {
      const path = "message-comments/ch-privatexx/me-messagex1/co-commentx1/reactions/:thumbsup:/us-janexxxxx"
      expect(users.mary).can.write(true).to.path(path)
      expect(users.mary).can.write(null).to.path(path)
    })

    it('jane can like and unlike marys comment', function() {
      const path = "message-comments/ch-privatexx/me-messagex1/co-commentx1/reactions/:thumbsup:/us-maryxxxxx"
      expect(users.jane).can.write(true).to.path(path)
      expect(users.jane).can.write(null).to.path(path)
      expect(users.jane).can.write(true).to.path(path)
    })

    it('cheeta cannot like marys comment because he not a channel member', function() {
      const path = "message-comments/ch-privatexx/me-messagex1/co-commentx1/reactions/:thumbsup:/us-cheetaxxx"
      expect(users.cheeta).cannot.write(true).to.path(path)
    })
  })

  describe('Comment reads', function() {

    it('comments can only be read by channel members or worker', function() {
      const path = "message-comments/ch-generalxx/me-messagex1"
      expect(users.unauth).cannot.read.path(path)
      expect(users.cheeta).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.mary).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.tarzan).can.read.path(path)
    })
  })
})