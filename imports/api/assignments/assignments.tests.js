/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import { Meteor } from 'meteor/meteor'
import { Factory } from 'meteor/dburles:factory'
import { assert } from 'meteor/practicalmeteor:chai'
import { Random } from 'meteor/random'
import { _ } from 'meteor/underscore'

import { Assignments } from './assignments.js'

if (Meteor.isServer) {
  require('./server/publications.js')

  describe('assignments', function () {
    describe('mutators', function () {
      it('builds correctly from factory', function () {
        const assignment = Factory.create('assignment')
        assert.typeOf(assignment, 'object')
        assert.typeOf(assignment.createdAt, 'date')
      })
    })

    it('leaves createdAt on update', function () {
      const createdAt = new Date(new Date() - 1000)
      let assignment = Factory.create('assignment', { createdAt })

      const text = 'some new text'
      Assignments.update(assignment, { $set: { text } })

      assignment = Assignments.findOne(assignment._id)
      assert.equal(assignment.text, text)
      assert.equal(assignment.createdAt.getTime(), createdAt.getTime())
    })

    describe('publications', function () {
      let publicList
      let privateList
      let userId

      before(function () {
        userId = Random.id()
        publicList = Factory.create('list')
        privateList = Factory.create('list', { userId })

        _.times(3, () => {
          Factory.create('assignment', { listId: publicList._id })
          // TODO get rid of userId, https://github.com/meteor/assignments/pull/49
          Factory.create('assignment', { listId: privateList._id, userId })
        })
      })

      // describe('assignments.inList', function () {
      //   it('sends all assignments for a public list', function (done) {
      //     const collector = new PublicationCollector();
      //     collector.collect('assignments.inList', publicList._id, (collections) => {
      //       chai.assert.equal(collections.Assignments.length, 3);
      //       done();
      //     });
      //   });

      //   it('sends all assignments for a public list when logged in', function (done) {
      //     const collector = new PublicationCollector({ userId });
      //     collector.collect('assignments.inList', publicList._id, (collections) => {
      //       chai.assert.equal(collections.Assignments.length, 3);
      //       done();
      //     });
      //   });

      //   it('sends all assignments for a private list when logged in as owner', function (done) {
      //     const collector = new PublicationCollector({ userId });
      //     collector.collect('assignments.inList', privateList._id, (collections) => {
      //       chai.assert.equal(collections.Assignments.length, 3);
      //       done();
      //     });
      //   });

      //   it('sends no assignments for a private list when not logged in', function (done) {
      //     const collector = new PublicationCollector();
      //     collector.collect('assignments.inList', privateList._id, (collections) => {
      //       chai.assert.isUndefined(collections.Assignments);
      //       done();
      //     });
      //   });

      //   it('sends no assignments for a private list when logged in as
      // another user', function (done) {
      //     const collector = new PublicationCollector({ userId: Random.id() });
      //     collector.collect('assignments.inList', privateList._id, (collections) => {
      //       chai.assert.isUndefined(collections.Assignments);
      //       done();
      //     });
      //   });
      // });
    })
  })
}
