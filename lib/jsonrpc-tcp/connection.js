var events = require('events');
var net = require('net');
var util = require('util');
var Parser = require('./jsonparser');

function Connection(socket, sessionFunc) {
  var self = this;
  
  events.EventEmitter.call(this);
  
  this._socket = socket || new net.Socket();
  this._socket.addListener('data', function(data) {
    self._parser.parse(data);
  });
  this._socket.addListener('close', function() {
    self.emit('close');
  });
  
  this._session = sessionFunc ? sessionFunc.call(this) : null;
  
  this._parser = new Parser(function(err, obj) {
    if (err) {
      // @todo: Close the connection.
      return self.emit('error', err);
    }
    
    if (obj.id) {
      self.emit('request', obj);
    } else {
      self.emit('notification', obj);
    }
  });
}

util.inherits(Connection, events.EventEmitter);

Connection.prototype.send = function(obj) {
  this._socket.write(JSON.stringify(obj));
}


module.exports = Connection;
