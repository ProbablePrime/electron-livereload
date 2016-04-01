'use strict';
const WebSocket = require('ws');
let windowId = 0;
function Client(browserWindow, port, setBounds, url) {
  var ref;
  this.port = port || 30080;
  this.url = url;
  this.sendBounds = setBounds || true;
  if (browserWindow) {
    this.browserWindow = browserWindow;
  } else if (process.type === 'renderer') {
    this.browserWindow = require('remote').getCurrentWindow();
  }
  this.id = ((ref = this.browserWindow) != null ? ref.id : void 0) || Client.getId();
  this.socket = new WebSocket('ws://localhost:' + this.port + '/');
  this.socket.on('open', () => {
    this.log('connected server');
    this.socket.on('message', msg => {
      const ref1 = JSON.parse(msg);
      const type = ref1.type;
      const data = ref1.data;
      if (type) {
        this.log('receive message: ' + msg);
        this.messageHandler(type, data);
      }
    });
  });
}

Client.prototype.getId = function() {
  return windowId++;
};

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
  switch (type) {
    case 'reload':
      if (this.browserWindow) {
        let currentUrl;
        if (!this.url) {
          currentUrl = this.browserWindow.webContents.getUrl();
        } else {
          currentUrl = this.url;
        }
        this.browserWindow.webContents.reloadIgnoringCache();
        return this.browserWindow.webContents.loadUrl(currentUrl);
      }
  }
};

Client.prototype.close = function() {
  this.socket.terminate();
};

module.exports = Client;
