var extend = require('util')._extend;
var util = require('util');
var split = require('split');

var Socket = require('net').Socket;

function QMP() {
  QMP.super_.call(this);
  this._commands = [];
};

util.inherits(QMP, Socket);

QMP.prototype.execute = function(command, arguments, callback) {
  if (typeof arguments === 'function') {
    callback = arguments;
    arguments = null;
  }

  this._commands.push(callback);

  if (arguments) {
    this.write(JSON.stringify({execute:command, arguments:arguments}));
  } else {
    this.write(JSON.stringify({execute:command}));
  }
};

QMP.prototype.connect = function(port, host, callback) {
  if (typeof host === 'function') {
    callback = host;
    host = null;
  }

  if (typeof port !== 'number') {
    // UNIX socket
    QMP.super_.prototype.connect.call(this, port);
  } else {
    QMP.super_.prototype.connect.call(this, port, host);
  }

  this.once('connect', function() {
    this.removeAllListeners('error');
  });

  this.once('error', function(err) {
    if (callback) callback(err);
  });

  this.once('data', function(data) {
    extend(this, JSON.parse(data).QMP);
    this.execute('qmp_capabilities');

    // Split response by line
    this.pipe(split()).on('data', (function(line) {
      if (!line) return this.end();
      var json = JSON.parse(line);

      if (json.return || json.error) {
        var callback = this._commands.shift();
        var error = (json.error) ? new Error(json.error.desc) : null;
        if (callback) callback.apply(this, [error, json.return]);
        if (error && !callback) this.emit('error', error);
      } else if (json.event) {
        // Emit QMP events
        this.emit(json.event.toLowerCase(), json.event);
      }
    }).bind(this));

    if (callback) callback.apply(this, [null, this]);
  });

  this.once('close', function() {
    this.end();
  });
};

module.exports = QMP;
