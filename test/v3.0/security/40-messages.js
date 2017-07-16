const chai = require('chai')
const targaryen = require('targaryen/plugins/chai')
const rules = targaryen.json.loadSync('rules/database.rules.json')
const expect = chai.expect
const testUtil = require('./util.js')
const users = testUtil.users
const data = testUtil.generateData()
const _ = require('lodash')

/* jshint -W117 */

chai.use(targaryen)
describe('Messages', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Message writes', function() {

    const message = {
      "attachments": {
        "at-ptaxohbh7": {
          "photo": {
            "filename": "20170209_095635_0110_270471.jpg",
            "height": 768,
            "source": "google-storage",
            "width": 1024,
            "uploading": true,
            "taken_at": 1444526248003,
            "location": {
              "lat": 47.593649999999997,
              "lng": -122.15950833333333
            },
          }
        }
      },
      "channel_id": "ch-generalxx",
      "created_at": 1444526248003,
      "created_at_desc": -1444526248003,
      "created_by": "us-janexxxxx",
      "modified_at": 1444526248003,
      "modified_by": "us-janexxxxx",
      "text": "Eat this."
    }

    const photo = {
      "filename": "20170209_095635_0110_270471.jpg",
      "height": 768,
      "source": "google-storage",
      "width": 1024,
      "taken_at": 1444526248003,
      "location": {
        "lat": 47.593649999999997,
        "lng": -122.15950833333333
      },
    }

    it('messages can only be created by channel editor', function() {
      const path = "channel-messages/ch-generalxx/me-messagex3"
      expect(users.cheeta).cannot.write(message, 1444526248003).to.path(path)
      expect(users.jane).can.write(message, 1444526248003).to.path(path)
    })

    it('messages can only be updated by message creator', function() {
      const path = "channel-messages/ch-generalxx/me-messagex1"
      const text = "Hey, what does a guy have to do to get a banana around here?"
      expect(users.cheeta).cannot.write(text).to.path(path + "/text")
      expect(users.jane).cannot.write(text).to.path(path + "/text")
      expect(users.tarzan).can.write(text).to.path(path + "/text")
    })

    it('message photo can be updated by message creator', function() {
      const path = "channel-messages/ch-generalxx/me-messagex1/attachments/at-attachxx1"
      expect(users.cheeta).cannot.write({"photo":photo}).to.path(path)
      expect(users.jane).cannot.write({"photo":photo}).to.path(path)
      expect(users.tarzan).can.write({"photo":photo}).to.path(path)
    })

    it('messages can only be deleted by message creator or channel owner', function() {
      const path = "channel-messages/ch-generalxx/me-messagex1"
      expect(users.cheeta).cannot.write(null).to.path(path)
      expect(users.jane).cannot.write(null).to.path(path)
      expect(users.tarzan).can.write(null).to.path(path)
    })

  })

  describe('Message reactions', function() {

    it('jane can like and unlike her own message in private channel', function() {
      const path = "channel-messages/ch-privatexx/me-messagex1/reactions/:thumbsup:/us-janexxxxx"
      expect(users.jane).can.write(true).to.path(path)
      expect(users.jane).can.write(null).to.path(path)
    })

    it('mary can like and unlike janes message in private channel', function() {
      const path = "channel-messages/ch-privatexx/me-messagex1/reactions/:thumbsup:/us-maryxxxxx"
      expect(users.mary).can.write(true).to.path(path)
      expect(users.mary).can.write(null).to.path(path)
      expect(users.mary).can.write(true).to.path(path)
    })

    it('tarzan cannot like janes message because he not a channel member', function() {
      const path = "channel-messages/ch-privatexx/me-messagex1/reactions/:thumbsup:/us-tarzanxxx"
      expect(users.tarzan).cannot.write(true).to.path(path)
    })
  })

  describe('Message reads', function() {

    it('messages can only be read by channel members or worker', function() {
      const path = "channel-messages/ch-generalxx/me-messagex1"
      expect(users.unauth).cannot.read.path(path)
      expect(users.cheeta).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.mary).can.read.path(path)
      expect(users.jane).can.read.path(path)
      expect(users.tarzan).can.read.path(path)
    })
  })
})