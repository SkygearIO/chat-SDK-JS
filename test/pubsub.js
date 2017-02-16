import {assert} from 'chai';
import sinon from 'sinon';

import skygear from 'skygear';
import SkygearChatPubsub from '../lib/pubsub';

const Conversation = skygear.Record.extend('conversation');

describe('skygear-chat', function() {
  before(function() {
    sinon.stub(SkygearChatPubsub.prototype, 'getUserChannel')
      .returns(Promise.resolve('user-channel'));
  });
  after(function() {
    SkygearChatPubsub.prototype.getUserChannel.restore();
  });

  describe('subscribeTypingHandler', function() {
    it('should subscribeAllTyping event', function(done) {
      const pubsub = new SkygearChatPubsub(skygear);
      const handler = function (payload) {
        assert.deepEqual(payload, {
          'conversation/id1': {
            'user/id': {
              event: "begin",
              at: "20161116T78:44:00Z"
            }
          }
        });
        done();
      }
      pubsub.subscribeAllTyping(handler);
      pubsub.dispatch({
        event: 'typing',
        data: {
          'conversation/id1': {
            'user/id': {
              event: "begin",
              at: "20161116T78:44:00Z"
            }
          }
        }
      });
    });

    it('should subscribeTyping event', function(done) {
      const pubsub = new SkygearChatPubsub(skygear);
      const handler = function (payload) {
        assert.deepEqual(payload, {
          'user/id': {
            event: "begin",
            at: "20161116T18:44:00Z"
          }
        });
        done();
      }
      const conversation = new Conversation({
        id: 'conversation/id1'
      });
      pubsub.subscribeTyping(conversation, handler);
      pubsub.dispatch({
        event: 'typing',
        data: {
          'conversation/id1': {
            'user/id': {
              event: "begin",
              at: "20161116T18:44:00Z"
            }
          },
          'conversation/id2': {
            'user/id2': {
              event: "begin",
              at: "20171116T18:44:00Z"
            }
          }
        }
      });
    });

    it('should unsubscribeTyping event', function() {
      const pubsub = new SkygearChatPubsub(skygear);
      const handler = function (payload) {
        throw Error('Unecpected call of unsubscribed handler');
      }
      const conversation = new Conversation({
        id: 'conversation/id1'
      });
      pubsub.subscribeTyping(conversation, handler);
      pubsub.unsubscribeTyping(conversation, handler);
      pubsub.dispatch({
        event: 'typing',
        data: {
          'conversation/id1': {
            'user/id': {
              event: "begin",
              at: "20161116T18:44:00Z"
            }
          }
        }
      });
    });

  });
});

