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
    this.last_message_ref = null;
  }

  static fromRecord(record, unread_count = 0, last_read_message_ref = null) {
    var conversation = new Conversation();
    conversation.title = record.title;
    conversation.last_message_ref = record.last_message;
    conversation.admin_ids = record.admin_ids;
    conversation.participant_ids = record.participant_ids;
    conversation.distinct_by_participants = record.distinct_by_participants;
    conversation.meta = record.meta;
    conversation.last_read_message_ref = last_read_message_ref;
    conversation.unread_count = unread_count;
    conversation.id = record.id;
    conversation._id = record._id;
    return conversation;
  }

  toRecord() {
    var record = new ConversationRecord({
      title: this.title,
      admin_ids: this.admin_ids,
      participant_ids: this.participant_ids,
      distinct_by_participants: this.distinct_by_participants,
      meta: this.meta,
      last_message: this.last_message_ref,
      _id: this._id,
      id: this.id
    });

    return record;
  }
}
