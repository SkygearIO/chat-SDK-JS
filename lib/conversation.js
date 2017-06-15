import skygear from 'skygear';
import _ from 'underscore';
/**
 *
 * Conversation
 *
 */
const ConversationRecord = skygear.Record.extend('conversation');
export default class Conversation {
  constructor(participants, title = null, meta = {}, options = {}) {
    this.title = title;
    this.meta = meta;
    if (options.distinctByParticipants === true) {
      this.distinct_by_participants = true;
    } else {
      this.distinct_by_participants = false;
    }
    const participant_ids = _.map(participants, function (user) {
      return user._id;
    });
    participant_ids.push(skygear.currentUser.id);
    this.participant_ids = _.unique(participant_ids);
    if (_.isEmpty(options.admins)) {
      this.admin_ids = this.participant_ids;
    } else {
      const admin_ids = _.map(options.admins, function (user) {
        return user._id;
      });
      this.admin_ids = _.unique(admin_ids);
    }
    this.unread_count = 0;
  }

  static fromRecord(record, unread_count = 0, last_read_message_ref = null) {
    var conversation = new Conversation();
    conversation.title = record.title;
    conversation.last_message_ref = record.last_message;
    conversation.admin_ids = record.admin_ids;
    conversation.participant_ids = record.participant_ids;
    conversation.distinct_by_participant = record.distinct_by_participant;
    conversation.meta = record.meta;
    conversation.last_read_message_ref = last_read_message_ref;
    conversation.unread_count = unread_count;
    conversation.id = record._id;
    return conversation;
  }

  static toRecord(conversation) {
    return new ConversationRecord({
      title: conversation.title,
      admin_ids: conversation.admin_ids,
      participant_ids: conversation.participant_ids,
      distinct_by_participant: conversation.distinct_by_participant,
      meta: conversation.meta,
      last_message: conversation.last_messsage_ref,
      _id: conversation.id
    });
  }
}
