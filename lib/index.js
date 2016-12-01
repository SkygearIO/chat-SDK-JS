const skygear = require('skygear');
const uuid = require('uuid');
const _ = require('underscore');

const Conversation = skygear.Record.extend('conversation');
const UserConversation = skygear.Record.extend('user_conversation');
const Message = skygear.Record.extend('message');
const UserChannel = skygear.Record.extend('user_channel');

class SkygearChatContainer {
  createConversation(participants, title, meta = {}, options = {}) {
    const conversation = new Conversation();
    conversation.title = title;
    conversation.meta = meta;
    if (options.distinctByParticipants === true) {
      conversation.distinct_by_participants = true;
    } else {
      conversation.distinct_by_participants = false;
    }
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });
    participant_ids.push(skygear.currentUser.id);
    conversation.participant_ids = _.unique(participant_ids);
    if (_.isEmpty(options.admins)) {
      conversation.admin_ids = conversation.participant_ids;
    } else {
      const admin_ids = _.map(options.admins, function (user) {
        return user._id;
      });
      conversation.admin_ids = _.unique(admin_ids);
    }
    return skygear.publicDB.save(conversation);
  }

  createDirectConversation(user, title, meta = {}, options = {}) {
    options.distinctByParticipants = true;
    return this.createConversation([user], title, meta, options);
  }

  getConversation(conversationID) {
    const query = new skygear.Query(Conversation);
    query.equalTo('_id', conversationID);
    return skygear.publicDB.query(query).then(function (records) {
      if (records.length > 0) {
        return records[0];
      }
      throw new Error('no conversation found');
    });
  }

  getConversations() {
    const query = new skygear.Query(Conversation);
    return skygear.publicDB.query(query);
  }

  getUserConversation(conversation) {
    const query = new skygear.Query(UserConversation);
    query.equalTo('user', skygear.currentUser.id);
    query.equalTo('conversation', new skygear.Reference(conversation.id));
    query.transientInclude('user');
    query.transientInclude('conversation');
    return skygear.publicDB.query(query).then(function (records) {
      if (records.length > 0) {
        return records[0];
      }
      throw new Error('no conversation found');
    });
  }

  getUserConversations() {
    const query = new skygear.Query(UserConversation);
    query.equalTo('user', skygear.currentUser.id);
    query.transientInclude('user');
    query.transientInclude('conversation');
    return skygear.publicDB.query(query);
  }

  deleteConversation(conversation_id) {
    return this.getConversation(conversation_id)
      .then(function (userConversation) {
        const conversation = userConversation.$transient.conversation;
        return skygear.publicDB.del(conversation);
      });
  }

  updateConversation(conversation, title, meta = {}) {
    if (title) {
      conversation.title = title;
    }
    conversation.meta = meta;
    return skygear.publicDB.save(conversation);
  }

  leaveConversation(conversation) {
    return skygear
      .lambda('chat:leave_conversation', [conversation._id]);
  }

  addParticipants(conversation, participants) {
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });
    conversation.participant_ids = _.union(
      conversation.participant_ids, participant_ids);

    return skygear.publicDB.save(conversation);
  }

  removeParticipants(conversation, participants) {
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });
    conversation.participant_ids = _.difference(
      conversation.participant_ids, participant_ids);
    conversation.admin_ids = _.difference(
      conversation.admin_ids, participant_ids);

    return skygear.publicDB.save(conversation);
  }

  addAdmins(conversation, admins) {
    const admin_ids = _.map(admins, function (user) {
      return user._id;
    });
    conversation.admin_ids = _.union(
      conversation.admin_ids, admin_ids);

    return skygear.publicDB.save(conversation);
  }

  removeAdmins(conversation, admins) {
    const admin_ids = _.map(admins, function (user) {
      return user._id;
    });
    conversation.admin_ids = _.difference(
      conversation.admin_ids, admin_ids);

    return skygear.publicDB.save(conversation);
  }

  createMessage(conversation_id, body, metadata, asset) {
    const message = new Message();
    message.conversation_id = new skygear.Reference(
      'conversation/' + conversation_id
    );
    message.body = body;

    if (metadata === undefined || metadata === null) {
      message.metadata = {};
    } else {
      message.metadata = metadata;
    }
    if (asset) {
      const skyAsset = new skygear.Asset({
        file: asset,
        name: asset.name
      });
      message.attachment = skyAsset;
    }

    return skygear.privateDB.save(message);
  }

  getUnreadCount() {
    return skygear
      .lambda('chat:total_unread');
  }

  getMessages(conversation, limit, before_time) {
    const conversationID = conversation._id;
    return skygear
      .lambda('chat:get_messages', [conversationID, limit, before_time])
      .then(function (data) {
        data.results = data.results.map(function (message_data) {
          return new Message(message_data);
        });
        this.markAsDelivered(data.results);
        return data;
      }.bind(this));
  }

  markAsDelivered(messages) {
    const message_ids = _.map(messages, function (m) {
      return m._id;
    });
    return skygear.lambda('chat:mark_as_delivered', [message_ids]);
  }

  markAsRead(messages) {
    const message_ids = _.map(messages, function (m) {
      return m._id;
    });
    return skygear.lambda('chat:mark_as_read', [message_ids]);
  }

  markAsLastMessageRead(conversation, message) {
    return this.getUserConversation(conversation).then(function (uc) {
      uc.last_read_message = new skygear.Reference(message);
      return skygear.publicDB.save(uc);
    });
  }

  getUnreadMessageCount(conversation) {
    return this.getUserConversation(conversation).then(function (uc) {
      return uc.unread_count;
    });
  }

  subscribe(handler) {
    _getOrCreateUserChannel().then(function (channel) {
      skygear.pubsub.connect();
      skygear.off(channel.name);
      skygear.on(channel.name, function (data) {
        data.record = new skygear.Record(data.record_type, data.record);
        if (data.original_record) {
          data.original_record = new skygear.Record(
            data.record_type, data.original_record);
        }
        handler(data);
      });
    });
  }
}

function _getOrCreateUserChannel() {
  const query = new skygear.Query(UserChannel);
  return skygear.privateDB.query(query).then(function (records) {
    if (records.length > 0) {
      return records[0];
    }
    return null;
  }).then(function (record) {
    if (record === null) {
      const channel = new UserChannel();
      channel.name = uuid.v4();
      return skygear.privateDB.save(channel);
    }
    return record;
  });
}


module.exports = new SkygearChatContainer();
