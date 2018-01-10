import skygear from 'skygear';
import _ from 'underscore';
import SkygearChatPubsub from './pubsub';

const Conversation = skygear.Record.extend('conversation');
const Message = skygear.Record.extend('message');
const Receipt = skygear.Record.extend('receipt');
const UserConversation = skygear.Record.extend('user_conversation');
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
   * const skygearChat = require('skygear-chat');
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
   * @param {boolean} [options.distinctByParticipants] - create conversation distinct by participants
   * @param {[]string|[]User} [options.admins] - admin IDs of the conversation
   *
   * @return {Promise<Conversation>} - Promise of the new Conversation Record
   */
  createConversation(participants, title = null, meta = {}, options = {}) {
    if (_.isArray(options.admins)) {
      options.adminIDs = options.admins.map((admin) => admin._id || admin);
      delete options.admins;
    }

    return skygear
      .lambda('chat:create_conversation', [participants, title, meta, options])
      .then((result) => {
        return new Conversation(result.conversation);
      });
  }

  /**
   * createDirectConversation is a helper function will create conversation
   * with distinctByParticipants set to true
   *
   * @example
   * const skygearChat = require('skygear-chat');
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
   * @param {[]string|[]User} [options.admins] - admin IDs of the conversation
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
   * @param {boolean} [includeLastMessage=true] - message is fetched and assigned to each conversation object.
   * @return {Promise<Conversation>}  A promise to array of Conversation
   */
  getConversation(conversationID, includeLastMessage = true) {
    return skygear
      .lambda('chat:get_conversation', [conversationID, includeLastMessage])
      .then((data) => {
        if (data.conversation === null) {
          throw new Error('no conversation found');
        }
        return new Conversation(data.conversation);
      });
  }

  /**
   * getConversations query a list of Conversation Records from Skygear which
   * are readable to the current user
   *
   * @param {number} [page=1] - Which page to display, default to the 1. The
   * first page
   * @param {number} [pageSize=50] - How many item pre page, default to 50.
   * @param {boolean} [includeLastMessage=true] - message is fetched and assigned to each conversation object.
   * @return {Promise<[]Conversation>} A promise to array of Conversation.
   */
  getConversations(page = 1, pageSize = 50, includeLastMessage = true) {
    return skygear
      .lambda('chat:get_conversations', [page, pageSize, includeLastMessage])
      .then((data) => {
        return data.conversations.map((record) => {
          return new Conversation(record);
        });
      });
  }

  /**
   * _getUserConversation query a UserConversation record of current logged
   * in user by conversation.id
   *
   * @param {Conversation} conversation - Conversation
   * @return {Promise<UserConversation>} - A promise to UserConversation Recrod
   * @private
   */
  _getUserConversation(conversation) {
    const query = new skygear.Query(UserConversation);
    query.equalTo('user', new skygear.Reference(skygear.auth.currentUser.id));
    query.equalTo('conversation', new skygear.Reference(conversation.id));
    return skygear.publicDB.query(query).then((records) => {
      if (records.length > 0) {
        return records[0];
      }
      throw new Error('no conversation found');
    });
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
    let newConversation = new Conversation();
    newConversation._id = conversation._id;
    if (title) {
      newConversation.title = title;
    }
    if (meta) {
      newConversation.meta = meta;
    }
    return skygear.publicDB.save(newConversation);
  }

  /**
   * Leave a conversation.
   *
   * @param {Conversation} conversation - Conversation to leave
   * @return {Promise<boolean>} - Promise of result
   */
  leaveConversation(conversation) {
    return skygear
      .lambda('chat:leave_conversation', [conversation._id])
      .then(() => {
        return true;
      });
  }

  /**
   * Delete a conversation.
   *
   * @param {Conversation} conversation - Conversation to be deleted
   * @return {Promise<boolean>} - Promise of result
   */
  deleteConversation(conversation) {
    return skygear
      .lambda('chat:delete_conversation', [conversation._id])
      .then(() => {
        return true;
      });
  }

  /**
   * addParticipants allow adding participants to a conversation.
   *
   * @param {Conversation} conversation - Conversation to update
   * @param {[]User} participants - array of Skygear User
   * @return {Promise<Conversation>} - A promise to save result
   */
  addParticipants(conversation, participants) {
    const conversation_id = skygear.Record.parseID(conversation.id)[1];
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });

    return skygear
      .lambda('chat:add_participants', [conversation_id, participant_ids])
      .then((data) => {
        return new Conversation(data.conversation);
      });
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
    const conversation_id = skygear.Record.parseID(conversation.id)[1];
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });
    return skygear
      .lambda('chat:remove_participants', [conversation_id, participant_ids])
      .then((data) => {
        return new Conversation(data.conversation);
      });
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
    const conversation_id = skygear.Record.parseID(conversation.id)[1];
    const admin_ids = _.map(admins, function (user) {
      return user._id;
    });
    return skygear
      .lambda('chat:add_admins', [conversation_id, admin_ids])
      .then((data) => {
        return new Conversation(data.conversation);
      });
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
    const conversation_id = skygear.Record.parseID(conversation.id)[1];
    const admin_ids = _.map(admins, function (user) {
      return user._id;
    });
    return skygear
      .lambda('chat:remove_admins', [conversation_id, admin_ids])
      .then((data) => {
        return new Conversation(data.conversation);
      });
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
   * @param {File|skygear.Asset} asset - Browser file object to be saves as
   * attachment of this message, also accept skygear.Asset instance
   * @return {Promise<Message>} - A promise to save result
   */
  createMessage(conversation, body, metadata, asset) {
    const message = new Message();

    message.conversation = new skygear.Reference(conversation.id);
    message.body = body;

    if (metadata === undefined || metadata === null) {
      message.metadata = {};
    } else {
      message.metadata = metadata;
    }
    if (asset) {
      if (asset instanceof skygear.Asset) {
        message.attachment = asset;
      } else {
        const skyAsset = new skygear.Asset({
          file: asset,
          name: asset.name
        });
        message.attachment = skyAsset;
      }
    }

    return skygear.publicDB.save(message);
  }

  /**
   * editMessage edit the body, meta and asset of an existing message
   *
   * @example
   * const skygearChat = require('skygear-chat');
   * skygearChat.editMessage(
   *   message,
   *    'new message Body',
   * ).then(function(result) {
   *   console.log('Save success', result);
   * });
   *
   * @param {Message} message - The message object to be edited
   * @param {string} body - New message body
   * @param {object} metadata - New application specific meta data for display
   * purpose, omitting thie parameter will keep the old meta
   * @param {File} asset - New file object to be saves as attachment of this
   * message, omitting thie parameter will keep the old asset
   * @return {Promise<Mesage>} A promise to save result
   */
  editMessage(message, body = null, metadata = null, asset = null) {
    if (body) {
      message.body = body;
    }
    if (metadata) {
      message.metadata = metadata;
    }
    if (asset) {
      const skyAsset = new skygear.Asset({
        file: asset,
        name: asset.name
      });
      message.attachment = skyAsset;
    }
    return skygear.publicDB.save(message);
  }


  /**
   * deleteMessage delete an existing message
   *
   * @example
   * const skygearChat = require('skygear-chat');
   * skygearChat.deleteMessage(
   *    message
   * ).then(function(result) {
   *    console.log('Deletion success', result);
   * });
   *
   * @param {Message} message - The message object to be deleted
   * @return {Promise<Message>} A promise to deleted message
   */
  deleteMessage(message) {
    return skygear
      .lambda('chat:delete_message', [message._id])
      .then(function (data) {
        return new Message(data);
      });
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
   * getMessages returns an array of message in a conversation. The way of
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
   * @param {string} order - order of the message, 'edited_at' or '_created_at'
   * @return {Promise<[]Message>} - array of Message records
   */
  getMessages(conversation, limit = 50, beforeTime = null, order = null) {
    const conversationID = conversation._id;
    const params = {
      conversation_id: conversationID,
      limit: limit
    };
    if (beforeTime) {
      params.before_time = beforeTime;
    }
    if (order) {
      params.order = order;
    }

    return skygear
      .lambda('chat:get_messages', params)
      .then(function (data) {
        data.results = data.results.map(function (message_data) {
          return new Message(message_data);
        });
        this.markAsDelivered(data.results);
        return data.results;
      }.bind(this));
  }

  /**
   * getMessageReceipts returns an array of receipts of a message.
   * @param {Message} message - the message
   * @return {Promise<[]Receipt>} - array of Receipt records
   */

  getMessageReceipts(message) {
    const messageID = message._id;
    return skygear
      .lambda('chat:get_receipt', [messageID])
      .then(function (data) {
        data.receipts = data.receipts.map(function (record) {
          return new Receipt(record);
        });
        return data.receipts;
      });
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
    return this._getUserConversation(conversation).then(function (uc) {
      uc.last_read_message = new skygear.Reference(message.id);
      skygear.publicDB.save(uc);
      conversation.last_read_message_ref = uc.last_read_message;
      conversation.last_read_message = message;
      return conversation;
    });
  }

  /**
   * getUnreadMessageCount query a unread count of a conversation
   * @param {Conversation} conversation - conversation to be query
   * @return {Promise<number>} - A promise to result
   * @deprecated Use conversation.unread_count instead
   */
  getUnreadMessageCount(conversation) {
    return conversation.unread_count;
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
   * check the `message_status` fields to see the new delivery status.
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
