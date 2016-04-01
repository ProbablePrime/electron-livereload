'use strict';
var Client, WebSocket;

WebSocket = require('ws');

Client = (function() {
  Client.windowId = 0;

  Client.getId = function() {
    return this.windowId++;
  };

  function Client(browserWindow, port, setBounds) {
    var ref;
    this.port = port || 30080;
    this.sendBounds = setBounds || true;
    if (browserWindow) {
      this.browserWindow = browserWindow;
    } else if (process.type === 'renderer') {
      this.browserWindow = require('remote').getCurrentWindow();
    }
    this.id = ((ref = this.browserWindow) != null ? ref.id : void 0) || Client.getId();
    this.socket = new WebSocket('ws://localhost:' + this.port + '/');
    this.socket.on('open', (function(_this) {
      return function() {
        _this.log('connected server');
        return _this.socket.on('message', function(msg) {
          var data, ref1, type;
          ref1 = JSON.parse(msg), type = ref1.type, data = ref1.data;
          if (type) {
            _this.log('receive message: ' + msg);
            return _this.messageHandler(type, data);
          }
        });
      };
    })(this));
    return;
  }

  Client.prototype.log = function(msg) {
    console.log('[' + (new Date).toISOString() + '] [electron-livereload] [client: ' + this.id + '] ' + msg);
  };

  Client.prototype.sendMessage = function(type, data) {
    this.socket.send({
      id: this.id,
      type: type,
      data: data
    });
  };

  Client.prototype.messageHandler = function(type, data) {
    var currentUrl;
    switch (type) {
      case 'reload':
        if (this.browserWindow) {
          currentUrl = this.browserWindow.webContents.getUrl();
          this.browserWindow.webContents.stop();
          this.browserWindow.webContents.destroy();
          this.browserWindow.webContents._reloadIgnoringCache();
          return this.browserWindow.webContents.loadUrl(currentUrl);
        }
    }
  };

  Client.prototype.close = function() {
    this.socket.terminate();
  };

  return Client;

})();

module.exports = Client;
RunLink
