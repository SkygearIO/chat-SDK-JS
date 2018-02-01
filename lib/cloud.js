/**
 * Copyright 2017 Oursky Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const skygearCloud = require('skygear/cloud');
const skygear = require('skygear');
const Conversation = skygear.Record.extend('conversation');
const User = skygear.Record.extend('user');
const Message = skygear.Record.extend('message');

export class SkygearChatCloudContainer {
  chatHook(name, func) {
    skygearCloud.op('chat:' + name + '_hook', function (param, options) {
      const context = {userId: options.context.user_id};
      func(param.args, context);
      return {status: 'ok'};
    }, {
      userRequired: true,
      keyRequired: true
    });
  }

  /**
   * After message sent hook.
   *
   * This hook will be triggered once a message is sent by an user.
   *
   * @example
   * const chat = require('skygear-chat');
   * chat.cloud.afterMessageSent((message, conversation, participants, context) => {
   *   const title = conversation.title;
   *   const participantIds = participants.map((p) => p._id && p._id != context.userId);
   *   const currentUser = participants.find((p) => p._id == context.userId);
   *   let body = '';
   *   if (message.body) {
   *     body = currentUser.username + ": " + message.body;
   *   } else {
   *     body = currentUser.username + ":" + "sent you a file.";
   *   }
   *   const payload = {'gcm': {'notification': {'title': title, 'body': body}}}
   *   container.push.sendToUser(participantIds, payload);
   * });
   *
   * @param {function(message:Record, conversation:Record, participants:Record[], context:Object)} func - function to be registered
   */

  afterMessageSent(func) {
    this.chatHook('after_message_sent', (args, context) => {
      const message = new Message(args.message);
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(message, conversation, participants, context);
    });
  }

  /**
   * After message updated hook.
   *
   * This hook will be triggered once a message is updated.
   *
   *
   * @param {function(message:Record, conversation:Record, participants:Record[], context:Object)} func - function to be registered
   */

  afterMessageUpdated(func) {
    this.chatHook('after_message_updated', (args, context) => {
      const message = new Message(args.message);
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(message, conversation, participants, context);
    });
  }

  /**
   * After message deleted hook.
   *
   * This hook will be triggered once a message is deleted.
   *
   * @param {function(message:Record, conversation:Record, participants:Record[], context:Object)} func - function to be registered
   */

  afterMessageDeleted(func) {
    this.chatHook('after_message_deleted', (args, context) => {
      const message = new Message(args.message);
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(message, conversation, participants, context);
    });
  }

  /**
   * Typing started hook.
   *
   * This hook will be triggered once an user starts typing.
   *
   * @param {function(conversation:Record, participants:Record[], event:Object, context: Object)} func - function to be registered
   */

  typingStarted(func) {
    this.chatHook('typing_started', (args, context) => {
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(conversation, participants, args.events, context);
    });
  }

  /**
   * After conversation created hook.
   *
   * This hook will be triggered once a conversation is created.
   *
   * @param {function(conversation:Record, participants:Record[], context:Object)} func - function to be registered
   */

  afterConversationCreated(func) {
    this.chatHook('after_conversation_created', (args, context) => {
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(conversation, participants, context);
    });
  }

  /**
   * After conversation updated hook.
   *
   * This hook will be triggered once a conversation is updated.
   *
   * @param {function(conversation:Record, participants:Record[], context:Object)} func - function to be registered
   */

  afterConversationUpdated(func) {
    this.chatHook('after_conversation_updated', (args, context) => {
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(conversation, participants, context);
    });
  }

  /**
   * After conversation deleted hook.
   *
   * This hook will be triggered once a conversation is deleted.
   *
   * @param {function(conversation:Record, participants:Record[], context:Object)} func - function to be registered
   */

  afterConversationDeleted(func) {
    this.chatHook('after_conversation_deleted', (args, context) => {
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      func(conversation, participants, context);
    });
  }

  /**
   * After user added to conversation hook.
   *
   * This hook will be triggered once one or more users are added to a conversation.
   *
   * @param {function(conversation:Record, participants:Record[], newUsers:Record[], context:Object)} func - function to be registered
   */

  afterUsersAddedToConversation(func) {
    this.chatHook('after_users_added_to_conversation', (args, context) => {
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      const newUsers = args.new_users.map((p) => new User(p));
      func(conversation, participants, newUsers, context);
    });
  }

  /**
   * After user removed from conversation hook.
   *
   * This hook will be triggered once one or more users are removed from a conversation.
   *
   * @param {function(conversation:Record, participants:Record[], oldUsers:Record[], context:Object)} func - function to be registered
   */

  afterUsersRemovedFromConversation(func) {
    this.chatHook('after_users_removed_from_conversation', (args, context) => {
      const conversation = new Conversation(args.conversation);
      const participants = args.participants.map((p) => new User(p));
      const oldUsers = args.old_users.map((p) => new User(p));
      func(conversation, participants, oldUsers, context);
    });
  }
}

const cloudContainer = new SkygearChatCloudContainer();
export default cloudContainer;
