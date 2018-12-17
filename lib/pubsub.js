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
    this.typingHandler = {};
    this.allTypingHandler = [];
    this.messageHandler = [];
  }

  async subscribeUserChannel() {
    // support new and old format record id
    const currentUserID = skygear.auth.currentUser && (
      skygear.auth.currentUser._recordID || skygear.auth.currentUser._id
    );
    if (!currentUserID) {
      throw new Error('login required');
    }
    if (this.userChannel && this.userChannel.ownerID === currentUserID) {
      return this.userChannel;
    }
    this.unsubscribeUserChannel();
    this.userChannel = await this.getUserChannel();
    this.subscribeDispatch(this.userChannel);
    return this.userChannel;
  }

  unsubscribeUserChannel() {
    if (this.userChannel) {
      this.unsubscribeDispatch(this.userChannel);
      this.userChannel = null;
      this.typingHandler = {};
      this.allTypingHandler = [];
      this.messageHandler = [];
    }
  }

  subscribeDispatch(channel) {
    this.pubsub.on(channel.name, this.dispatch);
  }

  unsubscribeDispatch(channel) {
    this.pubsub.off(channel.name, this.dispatch);
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

  async subscribeAllTyping(handler) {
    const userChannel = await this.subscribeUserChannel();
    this.allTypingHandler.push(handler);
    return userChannel;
  }

  async subscribeTyping(conversation, handler) {
    const userChannel = await this.subscribeUserChannel();
    if (!this.typingHandler[conversation.id]) {
      this.typingHandler[conversation.id] = [];
    }
    this.typingHandler[conversation.id].push(handler);
    return userChannel;
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

  async subscribeMessage(handler) {
    const userChannel = await this.subscribeUserChannel();
    this.messageHandler.push(handler);
    return userChannel;
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
    const query = new skygear.Query(UserChannel);
    const records = await skygear.privateDB.query(query);
    if (records.length > 0) {
      return records[0];
    } else {
      const channel = new UserChannel();
      channel.name = uuid.v4();
      return skygear.privateDB.save(channel);
    }
  }
}
