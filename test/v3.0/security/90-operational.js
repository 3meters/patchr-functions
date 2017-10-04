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
describe('Operational', function() {

  before(function() {
    targaryen.setFirebaseData(data)
    targaryen.setFirebaseRules(rules)
  })

  describe('Client info security', function() {
    it('anyone can read client node', function() {
      expect(users.unauth).can.read.path('clients')
    })
    it('nobody can write to client node', function() {
      expect(users.unauth).cannot.write({
        ios: 999
      }).to.path("clients")
    })
  })

  describe('Counters security', function() {
    it('tarzan and worker can read tarzan unread count', function() {
      expect(users.tarzan).can.read.path('counters/' + users.tarzan.uid)
      expect(users.worker).can.read.path('counters/' + users.tarzan.uid)
    })
    it('jane cannot read tarzans unread count', function() {
      expect(users.jane).cannot.read.path('counters/' + users.tarzan.uid)
    })
    it('only and worker can write tarzan unread count', function() {
      expect(users.jane).cannot.write(2).path('counters/' + users.tarzan.uid + '/unreads')
      expect(users.tarzan).cannot.write(2).path('counters/' + users.tarzan.uid + '/unreads')
      expect(users.worker).can.write(2).path('counters/' + users.tarzan.uid + '/unreads')
    })
    it('worker cannot write garbage to unread count', function() {
      expect(users.worker).cannot.write("some garbage for you").path('counters/' + users.tarzan.uid + '/unreads')
    })
  })

  describe('Installs security', function() {
    it('worker can read tarzans installs', function() {
      expect(users.worker).can.read.path('installs/' + users.tarzan.uid)
    })
    it('jane cannot read tarzans installs', function() {
      expect(users.jane).cannot.read.path('installs/' + users.tarzan.uid)
    })
    it('tarzan and worker can write tarzan installs', function() {
      expect(users.tarzan).can.write({
        "tokenId": true
      }).path('installs/' + users.tarzan.uid)
      expect(users.worker).can.write({
        "tokenId": true
      }).path('installs/' + users.tarzan.uid)
    })
    it('tarzan cannot write garbage install', function() {
      expect(users.tarzan).cannot.write("some garbage for you").path('installs/' + users.tarzan.uid)
      expect(users.tarzan).cannot.write({
        "tokenId": 999
      }).path('installs/' + users.tarzan.uid)
      expect(users.tarzan).cannot.write(999).path('installs/' + users.tarzan.uid)
    })
  })

  describe('Unreads security', function() {
    it('only worker can create unreads', function() {
      const path = 'unreads/us-janexxxxx/ch-generalxx/me-messagex1'
      expect(users.unauth).cannot.write(true).to.path(path)
      expect(users.mary).cannot.write(true).to.path(path)
      expect(users.tarzan).cannot.write(true).to.path(path)
      expect(users.jane).cannot.write(true).to.path(path)
      expect(users.worker).can.write('comments').to.path(path)
      expect(users.worker).can.write(true).to.path(path)
    })
    it('only worker can create comment unreads', function() {
      const path = 'unreads/us-janexxxxx/ch-generalxx/me-messagex1/comments/-KrWb-uWAFkrKQAS4NA8'
      expect(users.unauth).cannot.write(true).to.path(path)
      expect(users.mary).cannot.write(true).to.path(path)
      expect(users.tarzan).cannot.write(true).to.path(path)
      expect(users.jane).cannot.write(true).to.path(path)
      expect(users.worker).can.write(true).to.path(path) // comment
    })
    it('only current user or worker can read their unreads', function() {
      const path = 'unreads/us-janexxxxx'
      expect(users.unauth).cannot.read.path(path)
      expect(users.mary).cannot.read.path(path)
      expect(users.tarzan).cannot.read.path(path)
      expect(users.worker).can.read.path(path)
      expect(users.jane).can.read.path(path)
    })
    it('only current user or worker can remove message unreads', function() {
      const path = 'unreads/us-janexxxxx/ch-generalxx/me-messagex1'
      expect(users.unauth).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.tarzan).can.write(null).to.path(path) // group and channel owner
      expect(users.worker).can.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // inviter, group owner
    })
    it('only group|channel owner, inviter, or worker can remove channel unreads', function() {
      const path = 'unreads/us-janexxxxx/ch-generalxx'
      expect(users.unauth).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.tarzan).can.write(null).to.path(path) // group and channel owner
      expect(users.worker).can.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // inviter, group owner
    })
    it('only user or worker can remove user unreads', function() {
      const path = 'unreads/us-janexxxxx'
      expect(users.unauth).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.tarzan).cannot.write(null).to.path(path) // group owner
      expect(users.worker).can.write(null).to.path(path)
      expect(users.jane).can.write(null).to.path(path) // inviter, group owner
    })
    it('only worker can clear all unreads', function() {
      const path = 'unreads'
      expect(users.unauth).cannot.write(null).to.path(path)
      expect(users.mary).cannot.write(null).to.path(path)
      expect(users.tarzan).cannot.write(null).to.path(path)
      expect(users.jane).cannot.write(null).to.path(path)
      expect(users.worker).can.write(null).to.path(path)
    })
  })
})