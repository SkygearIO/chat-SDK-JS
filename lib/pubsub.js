import skygear from 'skygear';
import uuid from 'uuid';
import _ from 'underscore';

const UserChannel = skygear.Record.extend('user_channel');

/**
 * SkygearChatPubsub is a class for dsipatching the message from user_channel
 * to the coorrect handler according to the event type and registeration
 */
export default class SkygearChatPubsub {
  constructor(container) {
    this.pubsub = container.pubsub;
    this.userChannel = null;
    this.dispatch = this.dispatch.bind(this);
    (async () => {
      try {
        const channel = await this.getUserChannel();
        this.subscribeDispatch(channel);
      } catch (err) {
        console.log('SkygearChat: unable to get user channel', err);
      }
    })();
    this.typingHandler = {};
    this.allTypingHandler = [];
    this.messageHandler = [];
  }

  subscribeDispatch(channel) {
    this.pubsub.on(channel.name, this.dispatch);
  }

  dispatch(payload) {
    if (payload.event === 'typing') {
      this.dispatchTyping(payload.data);
    } else {
      this.dispatchUpdate(payload.data);
    }
  }

  dispatchUpdate(data) {
    const obj = {
      record_type: data.record_type,
      event_type: data.event_type
    };
    obj.record = new skygear.Record(data.record_type, data.record);
    if (data.original_record) {
      obj.original_record = new skygear.Record(
        data.record_type, data.original_record);
    }
    _.forEach(this.messageHandler, function (handler) {
      handler(obj);
    });
  }

  dispatchTyping(data) {
    _.forEach(this.allTypingHandler, function (ah) {
      ah(data);
    });
    _.forEach(data, function (t, conversationID) {
      const handlers = this.typingHandler[conversationID];
      _.forEach(handlers, function (h) {
        h(t);
      });
    }.bind(this));
  }

  sendTyping(conversation, state) {
    skygear.lambda('chat:typing', [
      conversation._id,
      state,
      new Date()
    ]);
  }

  subscribeAllTyping(handler) {
    this.allTypingHandler.push(handler);
  }

  subscribeTyping(conversation, handler) {
    if (!this.typingHandler[conversation.id]) {
      this.typingHandler[conversation.id] = [];
    }
    this.typingHandler[conversation.id].push(handler);
  }

  unsubscribeTyping(conversation, handler) {
    const conversationHandler = this.typingHandler[conversation.id];
    if (!conversationHandler) {
      return;
    }
    const index = conversationHandler.indexOf(handler);
    if (!handler || index === -1) {
      this.typingHandler[conversation.id] = [];
    } else {
      conversationHandler.splice(index, 1);
    }
  }

  subscribeMessage(handler) {
    this.messageHandler.push(handler);
  }

  unsubscribeMessage(handler) {
    const index = this.messageHandler.indexOf(handler);
    if (!handler || index === -1) {
      this.messageHandler = [];
    } else {
      this.messageHandler.splice(index, 1);
    }
  }

  async getUserChannel() {
    if (this.userChannel) {
      return this.userChannel;
    }
    const query = new skygear.Query(UserChannel);
    const records = await skygear.privateDB.query(query);
    if (records.length > 0) {
      this.userChannel = records[0];
      return this.userChannel;
    } else {
      const channel = new UserChannel();
      channel.name = uuid.v4();
      return skygear.privateDB.save(channel);
    }
  }
}
