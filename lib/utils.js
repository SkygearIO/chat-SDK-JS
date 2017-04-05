import skygearChat from './container.js';
import skygear from 'skygear';


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
export function createTypingDetector(
  conversation,
  {
    debounceTime = 3000
  } = {}
) {
  if (!(
    conversation instanceof skygear.Record &&
    conversation.recordType === 'conversation'
  )) {
    throw new Error(
      `TypingDetector expects Conversation, instead got ${conversation}.`
    );
  }
  let debounceTimer = null;
  function stopTyping() {
    skygearChat.sendTypingIndicator(
      conversation, 'finished'
    );
    debounceTimer = null;
  }
  function startTyping() {
    skygearChat.sendTypingIndicator(
      conversation, 'begin'
    );
    debounceTimer = setTimeout(
      stopTyping, debounceTime
    );
  }
  function resetTimer() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(
      stopTyping, debounceTime
    );
  }
  return function () {
    if (debounceTimer) {
      resetTimer();
    } else {
      startTyping();
    }
  };
}
