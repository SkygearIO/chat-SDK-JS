import skygear from 'skygear';

const Conversation = skygear.Record.extend('conversation');

// this list is retrieved from:
//   https://github.com/SkygearIO/chat/blob/1.6.0-3/chat/conversation_handlers.py#L211
Conversation.RESTRICTED_FIELD_KEYS = [
  'last_read_message_ref',
  'last_message',
  'admin_ids',
  'last_read_message',
  'unread_count',
  'last_message_ref',
  'participant_ids'
];

export default Conversation;
