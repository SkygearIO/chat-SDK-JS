import skygear from 'skygear';
import _ from 'underscore';
import SkygearChatPubsub from './pubsub';

const Conversation = skygear.Record.extend('conversation');
const UserConversation = skygear.Record.extend('user_conversation');
const Message = skygear.Record.extend('message');

/**
 * SkygearChatContainer provide API access to the chat plugin.
 */
export class SkygearChatContainer {
  /**
   * createConversation create an conversation with provided participants and
   * title.
   *
   * Duplicate call of createConversation with same list of participants will
   * return the different conversation, unless `distinctByParticipants` in
   * options is set to true. By default `distinctByParticipants` is false.
   *
   * Adding or removing participants from a distinct conversation (see below)
   * makes it non-distinct.
   *
   * For application specific attributes, you are suggested to put them as
   * meta.
   *
   * All participant will be admin unless specific in options.admins
   *
   * @example
   * const skygearChat = require('skygear-chat');¬
   *
   * skygearChat.createConversation([userBen], 'Greeting')
   *   .then(function (conversation) {
   *     console.log('Conversation created!', conversation);
   *   }, function (err) {
   *     console.log('Conversation created fails');
   *   });
   *
   * @param {[]User} participants - array of Skygear Users
   * @param {string} title - string for describing the conversation topic
   * @param {object} meta - attributes for application specific purpose
   * @param {object} [options] - options for the conversation, avaliable options `distinctByParticipants` and `admins`
   *
   * @return {Promise<Conversation>} - Promise of the new Conversation Record
   */
  createConversation(participants, title = null, meta = {}, options = {}) {
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

  /**
   * createDirectConversation is a helper function will create conversation
   * with distinctByParticipants set to true
   *
   * @example
   * const skygearChat = require('skygear-chat');¬
   *
   * skygearChat.createDirectConversation(userBen, 'Greeting')
   *   .then(function (conversation) {
   *     console.log('Conversation created!', conversation);
   *   }, function (err) {
   *     console.log('Conversation created fails');
   *   });
   *
   * @param {User} user - Skygear Users
   * @param {string} title - string for describing the conversation topic
   * @param {object} meta - attributes for application specific purpose
   * @param {object} [options] - options for the conversation, avaliable options `admins`
   *
   * @return {Promise<Conversation>} - Promise of the new Conversation Record
   */
  createDirectConversation(user, title = null, meta = {}, options = {}) {
    options.distinctByParticipants = true;
    return this.createConversation([user], title, meta, options);
  }

  /**
   * getConversation query a Conversation Record from Skygear
   *
   * @param {string} conversationID - ConversationID
   * @return {Promise<Conversation>}  A promise to array of Conversation Recrods
   */
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

  /**
   * getConversation query a list of Conversation Records from Skygear which
   * are readable to the current user
   *
   * @param {number} [page=1] - Which page to display, default to the 1. The
   * first page
   * @param {number} [pageSize=50] - How many item pre page, default to 50.
   * @return {Promise<[]Conversation>} A promise to array of Conversation Recrods
   */
  getConversations(page = 1, pageSize = 50) {
    const query = new skygear.Query(Conversation);
    query.limit = pageSize;
    query.offset = (page - 1) * pageSize;
    return skygear.publicDB.query(query);
  }

  /**
   * getUserConversations query all UserConversation record of current logged
   * in user.
   *
   * UserConversation is a Skygear Record contain user specific data to a
   * conversation, like `unread` count, `last_message`. This method will
   * return all UserConversation records assoicated to the current user. The
   * UserConversation will transientInclude Conversion and User object for
   * ease of use.
   *
   * For transientInclude of `last_message`, we provided an boolean flag
   * to include or not. This function will transientInclude the it unless
   * specified otherwise.
   *
   * @example
   * const skygearChat = require('skygear-chat');¬
   *
   * const ulNode = document.createElement('UL');
   * skygearChat.getUserConversation()
   *   .then(function (userConversations) {
   *     userConversations.forEach(function (uc) {
   *       const liNode = document.createElement('LI');
   *       liNode.appendChild(document.createTextNode(uc.conversation.title));
   *       liNode.appendChild(document.createTextNode(uc.unread));
   *       ulNode.appendChild(liNode);
   *     });
   *   }, function (err) {
   *     console.log('Cannot load conversation list');
   *   });
   *
   * @param {boolean} includeLastMessage - Transient include the
   * `last_message`, default is true.
   * @param {number} [page=1] - Which page to display, default to the 1. The
   * first page
   * @param {number} [pageSize=50] - How many item pre page, default to 50.
   * @return {Promise<[]UserConversation>} - A promise to UserConversation Recrods
   */
  getUserConversations(includeLastMessage = true, page = 1, pageSize = 50) {
    const query = new skygear.Query(UserConversation);
    query.limit = pageSize;
    query.offset = (page - 1) * pageSize;
    query.equalTo('user', skygear.currentUser.id);
    query.transientInclude('user');
    query.transientInclude('conversation');
    return skygear.publicDB.query(query).then(function (result) {
      if (!includeLastMessage) {
        return result;
      }
      return this._getMessageOfUserConversation(result);
    }.bind(this));
  }

  _getMessageOfUserConversation(userConversation) {
    const messageIDs = _.reduce(userConversation, function (mids, uc) {
      const conversation = uc.$transient.conversation;
      if (conversation.last_message) {
        const mid = skygear.Record.parseID(conversation.last_message.id)[1];
        mids.push(mid);
      }
      return mids;
    }, []);
    return skygear
      .lambda('chat:get_messages_by_ids', [messageIDs])
      .then(function (data) {
        const messagesByID = _.reduce(data.results, function (byID, m) {
          byID[m._id] = m;
          return byID;
        }, {});
        const ucWithMessage = _.reduce(
          userConversation,
          function (withMessage, uc) {
            const conversation = uc.$transient.conversation;
            if (conversation.last_message) {
              conversation.updateTransient({
                last_message: messagesByID[conversation.last_message.id]
              }, true);
            }
            withMessage.push(uc);
            return withMessage;
          },
          []);
        return ucWithMessage;
      });
  }

  /**
   * getUserConversations query a UserConversation record of current logged
   * in user and the pass in Conversation.
   *
   * The UserConversation will transientInclude Conversion and User object
   * for ease of use.
   *
   * For transientInclude of `last_read_message`, we provided an boolean flag
   * to include or not. This function will transientInclude the it unless
   * specified otherwise.
   *
   * @param {Conversation} conversation - Conversation
   * @param {boolean} includeLastMessage - Transient include the
   * `last_read_message`, default is true.
   * @return {Promise<UserConversation>} - A promise to UserConversation Recrod
   */
  getUserConversation(conversation, includeLastMessage = true) {
    const query = new skygear.Query(UserConversation);
    query.equalTo('user', skygear.currentUser.id);
    query.equalTo('conversation', new skygear.Reference(conversation.id));
    query.transientInclude('user');
    query.transientInclude('conversation');
    return skygear.publicDB.query(query).then(function (records) {
      if (records.length > 0) {
        if (!includeLastMessage) {
          return records[0];
        }
        return this._getMessageOfUserConversation(records).then(function (ucs) {
          return ucs[0];
        });
      }
      throw new Error('no conversation found');
    }.bind(this));
  }

  /**
   * updateConversation is a helper method for updating a conversation with
   * the provied title and meta.
   *
   * @param {Conversation} conversation - Conversation to update
   * @param {string} title - new title for describing the conversation topic
   * @param {object} meta - new attributes for application specific purpose
   * @return {Promise<Conversation>} - A promise to save result
   */
  updateConversation(conversation, title, meta) {
    if (title) {
      conversation.title = title;
    }
    if (meta) {
      conversation.meta = meta;
    }
    return skygear.publicDB.save(conversation);
  }

  /**
   * Leave a conversation.
   *
   * @param {Conversation} conversation - Conversation to leave
   * @return {Promise<boolean>} - Promise of result
   */
  leaveConversation(conversation) {
    return skygear
      .lambda('chat:leave_conversation', [conversation._id]);
  }

  /**
   * addParticipants allow adding participants to a conversation.
   *
   * @param {Conversation} conversation - Conversation to update
   * @param {[]User} participants - array of Skygear User
   * @return {Promise<Conversation>} - A promise to save result
   */
  addParticipants(conversation, participants) {
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });
    conversation.participant_ids = _.union(
      conversation.participant_ids, participant_ids);

    return skygear.publicDB.save(conversation);
  }

  /**
   * removeParticipants allow removal of participants from a conversation.
   *
   * Remove an user from participants of a conversation will also remove it
   * from admins.
   * @param {Conversation} conversation - Conversation to update
   * @param {[]User} participants - array of Skygear User
   * @return {Promise<COnversation>} - A promise to save result
   */
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

  /**
   * addAdmins allow adding admins to a conversation.
   *
   * The use will also add as participants of the conversation if he is not
   * already a participants of the conversation.
   * @param {Conversation} conversation - Conversation to update
   * @param {[]User} admins - array of Skygear User
   * @return {Promise<Conversation>} - A promise to save result
   */
  addAdmins(conversation, admins) {
    const admin_ids = _.map(admins, function (user) {
      return user._id;
    });
    conversation.admin_ids = _.union(
      conversation.admin_ids, admin_ids);
    conversation.participant_ids = _.union(
      conversation.participant_ids, admin_ids);

    return skygear.publicDB.save(conversation);
  }

  /**
   * removeAdmins allow removal of admins from a conversation.
   *
   * The removed user will still as the participants of the conversation.
   * @param {Conversation} conversation - Conversation to update
   * @param {[]User} admins - array of Skygear User
   * @return {Promise<Conversation>} - A promise to save result
   */
  removeAdmins(conversation, admins) {
    const admin_ids = _.map(admins, function (user) {
      return user._id;
    });
    conversation.admin_ids = _.difference(
      conversation.admin_ids, admin_ids);

    return skygear.publicDB.save(conversation);
  }

  /**
   * createMessage create a message in a conversation.
   *
   * A message can be just a text message, or a message with image, audio or
   * video attachment. Application developer can also save metadata to a
   * message, so the message can be display as important notice. The metadata
   * provide flexibility to application to control how to display the message,
   * like font and color.
   *
   * @example
   * const skygearChat = require('skygear-chat');
   *
   * skygearChat.createMessage(
   *   conversation,
   *   'Red in color, with attachment',
   *   {'color': 'red', },
   *   $('message-asset').files[0],
   * ).then(function (result) {
   *   console.log('Save success', result);
   * });
   *
   * @param {Conversation} conversation - create the message in this conversation
   * @param {string} body - body text of the message
   * @param {object} metadata - application specific meta data for display
   * purpose
   * @param {File} asset - File object to be saves as attachment of this
   * message
   * @return {Promise<Message>} - A promise to save result
   */
  createMessage(conversation, body, metadata, asset) {
    const message = new Message();

    message.conversation_id = new skygear.Reference(conversation.id);
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

  /**
   * getUnreadCount return following unread count;
   *
   * 1. The total unread message count of current user.
   * 2. The total number of conversation have one or more unread message.
   *
   * Format is as follow:
   * ```
   * {
   *   'conversation': 3,
   *   'message': 23
   * }
   * ```
   *
   * @example
   * const skygearChat = require('skygear-chat');¬
   *
   * skygearChat.getUnreadCount().then(function (count) {
   *   console.log('Total message unread count: ', count.message);
   *   console.log(
   *     'Total converation have unread message: ',
   *     count.conversation);
   * }, function (err) {
   *   console.log('Error: ', err);
   * });
   *
   * @return {Promise<object>} - A promise to total count object
   */
  getUnreadCount() {
    return skygear
      .lambda('chat:total_unread');
  }

  /**
   * getMessages return an array of message in a conversation. The way of
   * query is to provide `limit` and `beforeTime`. The expected way is to
   * query from the latest message first. And use the message `createdAt` to
   * query the next pages via setting `beforeTime` when user scroll.
   *
   * Once you query specific messages, the SDK will automatically mark the
   * message as delivery on the server.
   *
   * @example
   * const skygearChat = require('skygear-chat');¬
   *
   * const ulNode = document.createElement('UL');
   * const currentTime = new Date();
   * skygearChat.getMessages(conversation, 10, currentTime)
   *   .then(function (messages) {
   *     let lastMsgTime;
   *     message.forEach(function (m) {
   *       const liNode = document.createElement('LI');
   *       liNode.appendChild(document.createTextNode(m.content));
   *       ulNode.appendChild(liNode);
   *       lastMsgTime = m.createAt;
   *     });
   *     // Querying next page
   *     skygearChat.getMessages(conversation, 10, lastMsgTime).then(...);
   *   }, function (err) {
   *     console.log('Error: ', err);
   *   });
   *
   * @param {Conversation} conversation - conversation to query
   * @param {number} [limit=50] - limit the result set, if it is set to too large, may
   * result in timeout.
   * @param {Date} beforeTime - specific from which time
   * @return {Promise<[]Message>} - array of Message records
   */
  getMessages(conversation, limit = 50, beforeTime) {
    const conversationID = conversation._id;
    return skygear
      .lambda('chat:get_messages', [conversationID, limit, beforeTime])
      .then(function (data) {
        data.results = data.results.map(function (message_data) {
          return new Message(message_data);
        });
        this.markAsDelivered(data.results);
        return data.results;
      }.bind(this));
  }

  /**
   * markAsDelivered mark all messages as delivered
   *
   * @param {[]Message} messages - an array of message to mark as delivery
   * @return {Promise<boolean>}  A promise to result
   */
  markAsDelivered(messages) {
    const message_ids = _.map(messages, function (m) {
      return m._id;
    });
    return skygear.lambda('chat:mark_as_delivered', [message_ids]);
  }

  /**
   * markAsRead mark all messages as read
   *
   * @param {[]Message} messages - an array of message to mark as read
   * @return {Promise<boolean>} - A promise to result
   */
  markAsRead(messages) {
    const message_ids = _.map(messages, function (m) {
      return m._id;
    });
    return skygear.lambda('chat:mark_as_read', [message_ids]);
  }

  /**
   * markAsLastMessageRead mark the message as last read message.
   * Once you mark a message as last read, the system will update the unread
   * count at UserConversation.
   *
   * @param {Conversation} conversation - conversation the message belong to
   * @param {Message} message - message to be mark as last read
   * @return {Promise<number>} - A promise to result
   */
  markAsLastMessageRead(conversation, message) {
    return this.getUserConversation(conversation).then(function (uc) {
      uc.last_read_message = new skygear.Reference(message);
      return skygear.publicDB.save(uc);
    });
  }

  /**
   * getUnreadMessageCount query a unread count of a conversation
   *
   * @param {Conversation} conversation - conversation to be query
   * @return {Promise<number>} - A promise to result
   */
  getUnreadMessageCount(conversation) {
    return this.getUserConversation(conversation).then(function (uc) {
      return uc.unread_count;
    });
  }

  get pubsub() {
    if (!this._pubsub) {
      this._pubsub = new SkygearChatPubsub(skygear);
    }
    return this._pubsub;
  }

  /**
   * sendTypingIndicaton send typing indicator to the specified conversation.
   * The event can be `begin`, `pause` and `finished`.
   *
   * @param {Conversation} conversation - conversation to be query
   * @param {string} event - the event to send
   * @return {Promise<number>} - A promise to result
   */
  sendTypingIndicator(conversation, event) {
    this.pubsub.sendTyping(conversation, event);
  }

  /**
   * Subscribe to typing indicator events in a conversation.
   *
   * You are required to specify a conversation where typing indicator
   * events apply. You may subscribe to multiple conversation at the same time.
   * To get typing indicator event, call this method with a handler that
   * accepts following parameters.
   *
   * ```
   * {
   *   "user/id": {
   *     "event": "begin",
   *     "at": "20161116T78:44:00Z"
   *   },
   *   "user/id2": {
   *     "event": "begin",
   *     "at": "20161116T78:44:00Z"
   *   }
   * }
   * ```
   *
   * @param {Conversation} conversation - conversation to be query
   * @param {function} callback - function be be invoke when there is someone
   * typing in the specificed conversation
   */
  subscribeTypingIndicator(conversation, callback) {
    this.pubsub.subscribeTyping(conversation, callback);
  }

  /**
   * Subscribe to typing indicator events in all conversation.
   *
   * If you application want to dispatch the typing other than
   * per-conversation manner. You can use this method in stead of
   * `subscribeTypingIndicator`.
   *
   * The format of payload is similiar with conversation id as key to separate
   * users' typing event.
   * To get typing indicator event, call this method with a handler that
   * accepts following parameters.
   *
   * ```
   * {
   *   "conversation/id1": {
   *     "user/id": {
   *       "event": "begin",
   *       "at": "20161116T78:44:00Z"
   *     },
   *     "user/id2": {
   *       "event": "begin",
   *       "at": "20161116T78:44:00Z"
   *     }
   *   }
   * }
   * ```
   *
   * @param {function} callback - function be be invoke when there is someone
   * typing in conversation you have access to.
   */
  subscribeAllTypingIndicator(callback) {
    this.pubsub.subscribeAllTyping(callback);
  }

  /**
   * unsubscribe one or all typing indicator handler(s) from a conversation.
   *
   * @param {Conversation} conversation - conversation to be unsubscribe
   * @param {function?} handler - Which handler to remove,
   * if absent, all handlers are removed.
   */
  unsubscribeTypingIndicator(conversation, handler) {
    this.pubsub.unsubscribeTyping(conversation, handler);
  }

  /**
   * subscribe all message changes event from the system.
   *
   * The server will push all messsage change events via UserChannel that
   * concerning the current user. i.e. all message belongs to a conversation
   * that the current user have access to.
   *
   * The handler will receive following object as parameters
   *
   * ```
   * {
   *   "record_type": "message",
   *   "event_type": "create",
   *   "record": recordObj,
   *   "original_record": nulll
   * }
   * ```
   *
   * - `event_type` can be `update`, `create` and `delete`.
   * - `recordObj` is `skygear.Record` instance.
   *
   * Common use-case on the event_type:
   * `create` - other user send a message to the conversation and insert it in
   * the conversation view.
   * `updated` - when a message is received by other, the message delivery
   * status is changed. For example, from `delivered` to `some_read`. You can
   * check the `conversation_status` fields to see the new delivery status.
   *
   * @param {function} handler - function to be invoke when a notification arrive
   */
  subscribe(handler) {
    this.pubsub.subscribeMessage(handler);
  }
  /**
   * Unsubscribe one or all typing message handler(s)
   *
   * @param {function?} handler - Which handler to remove,
   * if absent, all handlers are removed.
   */
  unsubscribe(handler) {
    this.pubsub.unsubscribeMessage(handler);
  }
}

const chatContainer = new SkygearChatContainer();
export default chatContainer;
