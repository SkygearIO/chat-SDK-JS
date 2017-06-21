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

  /**
   * fromRecord create a Conversation record from conversation record, unread_count and messages
   * @param  {Record} record - Conversation Record
   * @param  {Int}    unread_count - Unread Count of an user in conversation
   * @param  {Record} last_message - Conversation Last Message Object
   * @param  {Reference} last_read_message_ref - Reference to User Last Read Message
   * @param  {Record}    last_read_message - User Last Read Message Object
   * @return {Conversation} Conversation object
   */

  static fromRecord(record,
          unread_count = 0,
          last_message = null,
          last_read_message_ref = null,
          last_read_message = null) {
    var conversation = new Conversation();
    record.attributeKeys.forEach((key)=>{
      conversation[key] = record[key];
    });
    conversation.last_message_ref = conversation.last_message;
    conversation.unread_count = unread_count;
    conversation.last_message = last_message;
    conversation.last_read_message = last_read_message;
    conversation.last_read_message_ref = last_read_message_ref;
    return conversation;
  }


  /**
   * toRecord - create record object from Conversation
   * @return {Record} Record object
   */

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
