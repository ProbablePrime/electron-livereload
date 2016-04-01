'use strict';
var Server, WebSocketServer, childProces, pid;

WebSocketServer = require('ws').Server;

childProces = require('child_process');

pid = null;

Server = (function() {
  function Server(opts) {
    var e, error;
    this.path = process.cwd();
    this.port = 30080;
    this.spawnOpt = {
      stdio: 'inherit'
    };
    this.sessions = [];
    this.storePid = function(pid) {
      return this.electronPid = pid;
    };
    if (opts != null ? opts.useGlobalElectron : void 0) {
      this.electron = 'electron';
    } else {
      try {
        this.electron = require('electron-prebuilt');
      } catch (error) {
        e = error;
        if (e.code === 'MODULE_NOT_FOUND') {
          this.log('electron-prebuilt not found, trying global electron');
          this.electron = 'electron';
        }
      }
    }
  }

  Server.prototype.log = function(msg) {
    console.log('[' + (new Date).toISOString() + '] [electron-livereload] [server]', msg);
  };

  Server.prototype.spawn = function(args, spawnOpt, cb) {
    var electronProc;
    electronProc = childProces.spawn(this.electron, [this.path].concat(args), spawnOpt);
    electronProc.on('error', (function(_this) {
      return function(err) {
        return _this.log('unable to start electron from ' + _this.path + '/' + _this.electron);
      };
    })(this));
    this.storePid(electronProc.pid);
  };

  Server.prototype.start = function(args) {
    if (args == null) {
      args = [];
    }
    this.wss = new WebSocketServer({
      port: this.port
    }, (function(_this) {
      return function() {
        return _this.spawn(args, _this.spawnOpt);
      };
    })(this));
    this.wss.on('connection', (function(_this) {
      return function(ws) {
        ws.on('message', function(message) {
          var data, id, ref, type;
          ref = JSON.parse(message), type = ref.type, data = ref.data, id = ref.id;
          _this.log('receive message from client(window_id: ' + id + ') ' + message);
          return messageHandler(type, data, ws);
        });
        return ws.on('close', function() {
          return _this.log('client closed.');
        });
      };
    })(this));
  };

  Server.prototype.sendMessage = function(ws, type, data) {
    if (data == null) {
      data = null;
    }
    ws.send(JSON.stringify({
      type: type,
      data: data
    }));
  };

  Server.prototype.messageHandler = function(type, data, ws) {
    switch (type) {
      case 'changeBounds':
        ws.bounds = data.bounds;
        break;
      case 'getBounds':
        this.sendMessage(ws, 'setBounds', {
          bounds: ws.bounds
        });
    }
  };

  Server.prototype.restart = function(args, cb) {
    this.stop();
    this.wss.close();
    process.nextTick((function(_this) {
      return function() {
        return _this.start();
      };
    })(this));
    this.log('restart electron process');
  };

  Server.prototype.stop = function() {
    this.log('kill electron process');
    process.kill(this.electronPid, 'SIGHUP');
  };

  Server.prototype.reload = function() {
    this.wss.clients.forEach((function(_this) {
      return function(ws) {
        return _this.sendMessage(ws, 'reload');
      };
    })(this));
  };

  return Server;

})();

module.exports = Server;
