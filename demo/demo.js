var $ = function(_id) {
  return document.getElementById(_id);
}

var inputVal = function(_id) {
  return $(_id).value;
}

var User = skygear.Record.extend('user');
var Message = skygear.Record.extend('message');

class Demo {
  constructor(container, plugin) {
    this.container = container;
    this.plugin = plugin;
    this.endpointEl = $('endpoint');
    this.apiKeyEl = $('api-key');
    this.usernameEl = $('currentUsername');
    this.emailEl = $('currentEmail');
    this.tokenEl = $('accessToken');
    this.directConversationEl = $('direct-conversation');
    this.groupConversationEl = $('group-conversation');
  }

  restore() {
    var endPoint = localStorage.getItem('skygear-endpoint');
    if (endPoint === null) {
      endPoint = 'https://chat.skygeario.com/';
    }
    var apiKey = localStorage.getItem('skygear-apikey');
    if (apiKey === null) {
      apiKey = 'apikey';
    }
    return this.configSkygear(endPoint, apiKey);
  }

  configSkygear(endPoint, apiKey) {
    return this.container.config({
      endPoint: endPoint,
      apiKey: apiKey
    }).then(function () {
      localStorage.setItem('skygear-endpoint', skygear.endPoint);
      localStorage.setItem('skygear-apikey', skygear.apiKey);
      this.endpointEl.value = skygear.endPoint;
      this.apiKeyEl.value = skygear.apiKey;
      this.displayCurrentUser();
      this.plugin.subscribe(this._handler.bind(this));
    }.bind(this));
  }

  cacheConversation(conversationID) {
    return this.plugin.getConversation(conversationID).then(function (result) {
      console.log(result);
      this.conversation = result;
    }.bind(this));
  }

  displayCurrentUser() {
    if (skygear.auth.currentUser) {
      this.usernameEl.textContent = skygear.auth.currentUser.username;
      this.emailEl.textContent = skygear.auth.currentUser.email;
      this.tokenEl.textContent = this.container.auth.accessToken;
    }
  }

  loginSkygear(username, pw) {
    return this.container.auth.loginWithUsername(username, pw).then(function (result) {
      console.log(result);
      this.displayCurrentUser();
    }.bind(this));
  }

  signupSkygear(username, pw) {
    return this.container.auth.signupWithUsername(username, pw).then(function (result) {
      console.log(result);
      this.displayCurrentUser();
    }.bind(this));
  }

  fetchUserTo(el) {
    var q = new skygear.Query(User);
    return this.container.publicDB.query(q).then(function (result) {
      var ul = $(el);
      ul.innerHTML = "";
      console.log(result);
      ul.textContent = JSON.stringify(result);
    });
  }

  fetchUnreadCountTo(conversationEl, messageEl) {
    return this.plugin.getUnreadCount().then(function (result) {
      var cEl = $(conversationEl);
      cEl.textContent = result.conversation;
      var mEl = $(messageEl);
      mEl.textContent = result.message;
    });
  }

  fetchConversationTo(conversationID, el) {
    return this.plugin.getConversation(conversationID).then(function (result) {
      var ul = $(el);
      console.log(result);
      ul.textContent = JSON.stringify(result);
    });
  }

  deleteConversationTo(conversationID, el) {
    return this.plugin.getConversation(conversationID).then(function (conversation) {
      this.plugin.deleteConversation(conversation).then(function (result) {
        var msg = "deleted conversation: " + conversationID;
        var span = $(el);
        span.textContent = msg;
        console.log(msg);
      }.bind(this));
    }.bind(this));
  }

  leaveConversation() {
    return this.plugin.leaveConversation(this.conversation);
  }

  fetchConversationsTo(el) {
    return this.plugin.getConversations().then(function (result) {
      var ul = $(el);
      ul.innerHTML = "";
      console.log(result);
      ul.textContent = JSON.stringify(result);
    });
  }

  createDirectConversation(username) {
    return this.container.auth.discoverUserByUsernames([username]).then(function (users) {
      var user = users[0]
      return this.plugin.createDirectConversation(user, username).then(function (result) {
        console.log(result);
        this.directConversationEl.textContent = result._id;
      }.bind(this), function (err) {
        console.log(err);
        this.directConversationEl.textContent = err.message;
      }.bind(this));
    }.bind(this));
  }

  createConversation(user1, user2, user3) {
    let users = [];
    [user1, user2, user3].map(function (u) {
      if (u) {
        users.push(u);
      }
    });
    return this.container.auth.discoverUserByUsernames(users).then(function (users) {
      return this.plugin.createConversation(
          Array.from(users),
          'From Demo'
        ).then(function (result) {
        console.log(result);
        this.groupConversationEl.textContent = result._id;
      }.bind(this));
    }.bind(this));
  }

  addParticipant(conversationID, username, resultTo) {
    const resultEl = $(resultTo);
    return this.container.auth.discoverUserByUsernames([username]).then(function (users) {
      return this.plugin.addParticipants(this.conversation, Array.from(users)).then(function (result) {
        console.log(result);
        resultEl.textContent = JSON.stringify(result);
      });
    }.bind(this));
  }

  removeParticipant(conversationID, username, resultTo) {
    const resultEl = $(resultTo);
    return this.container.auth.discoverUserByUsernames([username]).then(function (users) {
      return this.plugin.removeParticipants(this.conversation, Array.from(users)).then(function (result) {
        console.log(result);
        resultEl.textContent = JSON.stringify(result);
      });
    }.bind(this));
  }

  addAdmin(conversationID, username, resultTo) {
    const resultEl = $(resultTo);
    return this.container.auth.discoverUserByUsernames([username]).then(function (users) {
      return this.plugin.addAdmins(this.conversation, Array.from(users)).then(function (result) {
        console.log(result);
        resultEl.textContent = JSON.stringify(result);
      });
    }.bind(this));
  }

  removeAdmin(conversationID, username, resultTo) {
    const resultEl = $(resultTo);
    return this.container.auth.discoverUserByUsernames([username]).then(function (users) {
      return this.plugin.removeAdmins(this.conversation, Array.from(users)).then(function (result) {
        console.log(result);
        resultEl.textContent = JSON.stringify(result);
      });
    }.bind(this));
  }

  markAsRead(messageID) {
    // This is a hack and for normal use-case, we should use the message
    // object queried from getMessages
    const message = new skygear.Record('message', {
      _id: 'message/' + messageID
    });
    return this.plugin.markAsRead([message]);
  }

  getMessagesTo(limit, beforeTime, order, el) {
    return this.plugin.getMessages(this.conversation, limit, beforeTime, order).then(function (result) {
      var ul = $(el);
      ul.innerHTML = "";
      console.log(result);
      ul.textContent = JSON.stringify(result);
    }.bind(this));
  }

  getMessageReceiptsTo(messageID, el) {
    // This is a hack and for normal use-case, we should use the message
    // object queried from getMessages
    const message = new skygear.Record('message', {
      _id: 'message/' + messageID
    });

    return this.plugin.getMessageReceipts(message).then(function (result) {
      var ul = $(el);
      ul.innerHTML = "";
      console.log(result);
      ul.textContent = JSON.stringify(result);
    }.bind(this));
  }


  createMessage(content, metadata, asset, el) {
    return this.plugin.createMessage(
      this.conversation,
      content,
      metadata,
      asset
     ).then(function (result) {
      var ul = $(el);
      console.log(result);
      ul.textContent = JSON.stringify(result);
    }.bind(this));
  }

  startTyping() {
    return this.plugin.sendTypingIndicator(this.conversation, 'begin');
  }

  stopTyping() {
    return this.plugin.sendTypingIndicator(this.conversation, 'finished');
  }

  subscribeTypingTo(el) {
    const indicateEl = $(el);
    return this.plugin.subscribeTypingIndicator(this.conversation, function (payload) {
      console.log(payload);
      indicateEl.textContent = JSON.stringify(payload);
    });
  }

  unsubscribeTyping() {
    return this.plugin.unsubscribeTypingIndicator(this.conversation);
  }

  editMessage(messageID, newBody, newMeta) {
    // This is a hack and for normal use-case, we should use the message
    // object queried from getMessages
    const query = new skygear.Query(Message);
    query.equalTo('_id', messageID);
    return skygear.publicDB.query(query).then(function (records) {
      if (records.length > 0) {
        var message = records[0];
        message.body = newBody;
        return this.plugin.editMessage(
          message,
          newBody,
          newMeta
        ).then(function(result){
          console.log(result);
        });
      }
      throw new Error('no message found');
    }.bind(this));
  }

  deleteMessage(messageID) {
    // This is a hack and for normal use-case, we should use the message
    // object queried from getMessages
    const message = new skygear.Record('message', {
      _id: 'message/' + messageID
    });
    return this.plugin.deleteMessage(
      message
    ).then(function(result){
      console.log(result);
    });
  }

  _handler(data) {
    if (this.handler) {
      this.handler(data);
    } else {
      console.log(data);
    }
  }
}

