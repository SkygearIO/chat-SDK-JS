(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.skygearChat = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SkygearChatContainer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _skygear = (typeof window !== "undefined" ? window['skygear'] : typeof global !== "undefined" ? global['skygear'] : null);

var _skygear2 = _interopRequireDefault(_skygear);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _pubsub = require('./pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Conversation = _skygear2.default.Record.extend('conversation');
var Message = _skygear2.default.Record.extend('message');
var Receipt = _skygear2.default.Record.extend('receipt');
var UserConversation = _skygear2.default.Record.extend('user_conversation');
/**
 * SkygearChatContainer provide API access to the chat plugin.
 */

var SkygearChatContainer = exports.SkygearChatContainer = function () {
  function SkygearChatContainer() {
    _classCallCheck(this, SkygearChatContainer);
  }

  _createClass(SkygearChatContainer, [{
    key: 'createConversation',

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
     *
     * @return {Promise<Conversation>} - Promise of the new Conversation Record
     */
    value: function createConversation(participants) {
      var title = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var meta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      return _skygear2.default.lambda('chat:create_conversation', [participants, title, meta, options]).then(function (result) {
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
     *
     * @return {Promise<Conversation>} - Promise of the new Conversation Record
     */

  }, {
    key: 'createDirectConversation',
    value: function createDirectConversation(user) {
      var title = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var meta = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

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

  }, {
    key: 'getConversation',
    value: function getConversation(conversationID) {
      var includeLastMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      return _skygear2.default.lambda('chat:get_conversation', [conversationID, includeLastMessage]).then(function (data) {
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

  }, {
    key: 'getConversations',
    value: function getConversations() {
      var page = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var pageSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;
      var includeLastMessage = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      return _skygear2.default.lambda('chat:get_conversations', [page, pageSize, includeLastMessage]).then(function (data) {
        return data.conversations.map(function (record) {
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

  }, {
    key: '_getUserConversation',
    value: function _getUserConversation(conversation) {
      var query = new _skygear2.default.Query(UserConversation);
      query.equalTo('user', new _skygear2.default.Reference(_skygear2.default.auth.currentUser.id));
      query.equalTo('conversation', new _skygear2.default.Reference(conversation.id));
      return _skygear2.default.publicDB.query(query).then(function (records) {
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

  }, {
    key: 'updateConversation',
    value: function updateConversation(conversation, title, meta) {
      var newConversation = new Conversation();
      newConversation._id = conversation._id;
      if (title) {
        newConversation.title = title;
      }
      if (meta) {
        newConversation.meta = meta;
      }
      return _skygear2.default.publicDB.save(newConversation);
    }

    /**
     * Leave a conversation.
     *
     * @param {Conversation} conversation - Conversation to leave
     * @return {Promise<boolean>} - Promise of result
     */

  }, {
    key: 'leaveConversation',
    value: function leaveConversation(conversation) {
      return _skygear2.default.lambda('chat:leave_conversation', [conversation._id]).then(function () {
        return true;
      });
    }

    /**
     * Delete a conversation.
     *
     * @param {Conversation} conversation - Conversation to be deleted
     * @return {Promise<boolean>} - Promise of result
     */

  }, {
    key: 'deleteConversation',
    value: function deleteConversation(conversation) {
      return _skygear2.default.lambda('chat:delete_conversation', [conversation._id]).then(function () {
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

  }, {
    key: 'addParticipants',
    value: function addParticipants(conversation, participants) {
      var conversation_id = _skygear2.default.Record.parseID(conversation.id)[1];
      var participant_ids = _underscore2.default.map(participants, function (user) {
        return user._id;
      });

      return _skygear2.default.lambda('chat:add_participants', [conversation_id, participant_ids]).then(function (data) {
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

  }, {
    key: 'removeParticipants',
    value: function removeParticipants(conversation, participants) {
      var conversation_id = _skygear2.default.Record.parseID(conversation.id)[1];
      var participant_ids = _underscore2.default.map(participants, function (user) {
        return user._id;
      });
      return _skygear2.default.lambda('chat:remove_participants', [conversation_id, participant_ids]).then(function (data) {
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

  }, {
    key: 'addAdmins',
    value: function addAdmins(conversation, admins) {
      var conversation_id = _skygear2.default.Record.parseID(conversation.id)[1];
      var admin_ids = _underscore2.default.map(admins, function (user) {
        return user._id;
      });
      return _skygear2.default.lambda('chat:add_admins', [conversation_id, admin_ids]).then(function (data) {
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

  }, {
    key: 'removeAdmins',
    value: function removeAdmins(conversation, admins) {
      var conversation_id = _skygear2.default.Record.parseID(conversation.id)[1];
      var admin_ids = _underscore2.default.map(admins, function (user) {
        return user._id;
      });
      return _skygear2.default.lambda('chat:remove_admins', [conversation_id, admin_ids]).then(function (data) {
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

  }, {
    key: 'createMessage',
    value: function createMessage(conversation, body, metadata, asset) {
      var message = new Message();

      message.conversation = new _skygear2.default.Reference(conversation.id);
      message.body = body;

      if (metadata === undefined || metadata === null) {
        message.metadata = {};
      } else {
        message.metadata = metadata;
      }
      if (asset) {
        if (asset instanceof _skygear2.default.Asset) {
          message.attachment = asset;
        } else {
          var skyAsset = new _skygear2.default.Asset({
            file: asset,
            name: asset.name
          });
          message.attachment = skyAsset;
        }
      }

      return _skygear2.default.publicDB.save(message);
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

  }, {
    key: 'editMessage',
    value: function editMessage(message) {
      var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      var asset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      if (body) {
        message.body = body;
      }
      if (metadata) {
        message.metadata = metadata;
      }
      if (asset) {
        var skyAsset = new _skygear2.default.Asset({
          file: asset,
          name: asset.name
        });
        message.attachment = skyAsset;
      }
      return _skygear2.default.publicDB.save(message);
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

  }, {
    key: 'deleteMessage',
    value: function deleteMessage(message) {
      return _skygear2.default.lambda('chat:delete_message', [message._id]).then(function (data) {
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

  }, {
    key: 'getUnreadCount',
    value: function getUnreadCount() {
      return _skygear2.default.lambda('chat:total_unread');
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

  }, {
    key: 'getMessages',
    value: function getMessages(conversation) {
      var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;
      var beforeTime = arguments[2];
      var order = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      var conversationID = conversation._id;
      return _skygear2.default.lambda('chat:get_messages', [conversationID, limit, beforeTime, order]).then(function (data) {
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

  }, {
    key: 'getMessageReceipts',
    value: function getMessageReceipts(message) {
      var messageID = message._id;
      return _skygear2.default.lambda('chat:get_receipt', [messageID]).then(function (data) {
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

  }, {
    key: 'markAsDelivered',
    value: function markAsDelivered(messages) {
      var message_ids = _underscore2.default.map(messages, function (m) {
        return m._id;
      });
      return _skygear2.default.lambda('chat:mark_as_delivered', [message_ids]);
    }

    /**
     * markAsRead mark all messages as read
     *
     * @param {[]Message} messages - an array of message to mark as read
     * @return {Promise<boolean>} - A promise to result
     */

  }, {
    key: 'markAsRead',
    value: function markAsRead(messages) {
      var message_ids = _underscore2.default.map(messages, function (m) {
        return m._id;
      });
      return _skygear2.default.lambda('chat:mark_as_read', [message_ids]);
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

  }, {
    key: 'markAsLastMessageRead',
    value: function markAsLastMessageRead(conversation, message) {
      return this._getUserConversation(conversation).then(function (uc) {
        uc.last_read_message = new _skygear2.default.Reference(message.id);
        _skygear2.default.publicDB.save(uc);
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

  }, {
    key: 'getUnreadMessageCount',
    value: function getUnreadMessageCount(conversation) {
      return conversation.unread_count;
    }
  }, {
    key: 'sendTypingIndicator',


    /**
     * sendTypingIndicaton send typing indicator to the specified conversation.
     * The event can be `begin`, `pause` and `finished`.
     *
     * @param {Conversation} conversation - conversation to be query
     * @param {string} event - the event to send
     * @return {Promise<number>} - A promise to result
     */
    value: function sendTypingIndicator(conversation, event) {
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

  }, {
    key: 'subscribeTypingIndicator',
    value: function subscribeTypingIndicator(conversation, callback) {
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

  }, {
    key: 'subscribeAllTypingIndicator',
    value: function subscribeAllTypingIndicator(callback) {
      this.pubsub.subscribeAllTyping(callback);
    }

    /**
     * unsubscribe one or all typing indicator handler(s) from a conversation.
     *
     * @param {Conversation} conversation - conversation to be unsubscribe
     * @param {function?} handler - Which handler to remove,
     * if absent, all handlers are removed.
     */

  }, {
    key: 'unsubscribeTypingIndicator',
    value: function unsubscribeTypingIndicator(conversation, handler) {
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

  }, {
    key: 'subscribe',
    value: function subscribe(handler) {
      this.pubsub.subscribeMessage(handler);
    }
    /**
     * Unsubscribe one or all typing message handler(s)
     *
     * @param {function?} handler - Which handler to remove,
     * if absent, all handlers are removed.
     */

  }, {
    key: 'unsubscribe',
    value: function unsubscribe(handler) {
      this.pubsub.unsubscribeMessage(handler);
    }
  }, {
    key: 'pubsub',
    get: function get() {
      if (!this._pubsub) {
        this._pubsub = new _pubsub2.default(_skygear2.default);
      }
      return this._pubsub;
    }
  }]);

  return SkygearChatContainer;
}();

var chatContainer = new SkygearChatContainer();
exports.default = chatContainer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./pubsub":3,"underscore":5}],2:[function(require,module,exports){
'use strict';

var _container = require('./container.js');

var _container2 = _interopRequireDefault(_container);

var _utils = require('./utils.js');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_container2.default.utils = utils;

module.exports = _container2.default;

},{"./container.js":1,"./utils.js":4}],3:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _skygear = (typeof window !== "undefined" ? window['skygear'] : typeof global !== "undefined" ? global['skygear'] : null);

var _skygear2 = _interopRequireDefault(_skygear);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserChannel = _skygear2.default.Record.extend('user_channel');

/**
 * SkygearChatPubsub is a class for dsipatching the message from user_channel
 * to the coorrect handler according to the event type and registeration
 */

var SkygearChatPubsub = function () {
  function SkygearChatPubsub(container) {
    _classCallCheck(this, SkygearChatPubsub);

    this.pubsub = container.pubsub;
    this.userChannel = null;
    this.dispatch = this.dispatch.bind(this);
    this.getUserChannel().then(this.subscribeDispatch.bind(this));
    this.typingHandler = {};
    this.allTypingHandler = [];
    this.messageHandler = [];
  }

  _createClass(SkygearChatPubsub, [{
    key: 'subscribeDispatch',
    value: function subscribeDispatch(channel) {
      this.pubsub.on(channel.name, this.dispatch);
    }
  }, {
    key: 'dispatch',
    value: function dispatch(payload) {
      if (payload.event === 'typing') {
        this.dispatchTyping(payload.data);
      } else {
        this.dispatchUpdate(payload.data);
      }
    }
  }, {
    key: 'dispatchUpdate',
    value: function dispatchUpdate(data) {
      var obj = {
        record_type: data.record_type,
        event_type: data.event_type
      };
      obj.record = new _skygear2.default.Record(data.record_type, data.record);
      if (data.original_record) {
        obj.original_record = new _skygear2.default.Record(data.record_type, data.original_record);
      }
      _underscore2.default.forEach(this.messageHandler, function (handler) {
        handler(obj);
      });
    }
  }, {
    key: 'dispatchTyping',
    value: function dispatchTyping(data) {
      _underscore2.default.forEach(this.allTypingHandler, function (ah) {
        ah(data);
      });
      _underscore2.default.forEach(data, function (t, conversationID) {
        var handlers = this.typingHandler[conversationID];
        _underscore2.default.forEach(handlers, function (h) {
          h(t);
        });
      }.bind(this));
    }
  }, {
    key: 'sendTyping',
    value: function sendTyping(conversation, state) {
      _skygear2.default.lambda('chat:typing', [conversation._id, state, new Date()]);
    }
  }, {
    key: 'subscribeAllTyping',
    value: function subscribeAllTyping(handler) {
      this.allTypingHandler.push(handler);
    }
  }, {
    key: 'subscribeTyping',
    value: function subscribeTyping(conversation, handler) {
      if (!this.typingHandler[conversation.id]) {
        this.typingHandler[conversation.id] = [];
      }
      this.typingHandler[conversation.id].push(handler);
    }
  }, {
    key: 'unsubscribeTyping',
    value: function unsubscribeTyping(conversation, handler) {
      var conversationHandler = this.typingHandler[conversation.id];
      if (!conversationHandler) {
        return;
      }
      var index = conversationHandler.indexOf(handler);
      if (!handler || index === -1) {
        this.typingHandler[conversation.id] = [];
      } else {
        conversationHandler.splice(index, 1);
      }
    }
  }, {
    key: 'subscribeMessage',
    value: function subscribeMessage(handler) {
      this.messageHandler.push(handler);
    }
  }, {
    key: 'unsubscribeMessage',
    value: function unsubscribeMessage(handler) {
      var index = this.messageHandler.indexOf(handler);
      if (!handler || index === -1) {
        this.messageHandler = [];
      } else {
        this.messageHandler.splice(index, 1);
      }
    }
  }, {
    key: 'getUserChannel',
    value: function getUserChannel() {
      if (this.userChannel) {
        return Promise.resolve(this.userChannel);
      }
      var query = new _skygear2.default.Query(UserChannel);
      return _skygear2.default.privateDB.query(query).then(function (records) {
        if (records.length > 0) {
          this.userChannel = records[0];
          return this.userChannel;
        }
        return null;
      }.bind(this)).then(function (record) {
        if (record === null) {
          var channel = new UserChannel();
          channel.name = _uuid2.default.v4();
          return _skygear2.default.privateDB.save(channel);
        }
        this.userChannel = record;
        return this.userChannel;
      }.bind(this));
    }
  }]);

  return SkygearChatPubsub;
}();

exports.default = SkygearChatPubsub;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"underscore":5,"uuid":6}],4:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTypingDetector = createTypingDetector;

var _container = require('./container.js');

var _container2 = _interopRequireDefault(_container);

var _skygear = (typeof window !== "undefined" ? window['skygear'] : typeof global !== "undefined" ? global['skygear'] : null);

var _skygear2 = _interopRequireDefault(_skygear);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Detects whether the user is typing in an input field and send typing events to the server.
 *
 * @example
 * <script>
 *  var typing = createTypingDetector(conversation);
 * </script>
 * <input type=text oninput="typing()" />
 *
 * @param {Conversation} conversation - send typing events to this conversation.
 * @param {Object} [options]
 * @param {number} [options.debounceTime = 3000] - interger of miliseconds to debounce calls
 * @return {function}
 */
function createTypingDetector(conversation) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$debounceTime = _ref.debounceTime,
      debounceTime = _ref$debounceTime === undefined ? 3000 : _ref$debounceTime;

  if (!(conversation instanceof _skygear2.default.Record && conversation.recordType === 'conversation')) {
    throw new Error('TypingDetector expects Conversation, instead got ' + conversation + '.');
  }
  var debounceTimer = null;
  function stopTyping() {
    _container2.default.sendTypingIndicator(conversation, 'finished');
    debounceTimer = null;
  }
  function startTyping() {
    _container2.default.sendTypingIndicator(conversation, 'begin');
    debounceTimer = setTimeout(stopTyping, debounceTime);
  }
  function resetTimer() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(stopTyping, debounceTime);
  }
  return function () {
    if (debounceTimer) {
      resetTimer();
    } else {
      startTyping();
    }
  };
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./container.js":1}],5:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],6:[function(require,module,exports){
var v1 = require('./v1');
var v4 = require('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;

},{"./v1":9,"./v4":10}],7:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],8:[function(require,module,exports){
(function (global){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":7,"./lib/rng":8}],10:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":7,"./lib/rng":8}]},{},[2])(2)
});