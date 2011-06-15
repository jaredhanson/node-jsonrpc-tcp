var events = require('events');
var net = require('net');
var util = require('util');
var Parser = require('./jsonparser');

function Connection(socket) {
  var self = this;
  
  events.EventEmitter.call(this);
  
  this._socket = socket || new net.Socket();
  this._socket.addListener('connect', self.emit.bind(self, 'connect'));
  this._socket.addListener('data', function(data) {
    console.log('recv:' + data);
    self._parser.parse(data);
  });
  this._socket.addListener('close', self.emit.bind(self, 'close'));
  
  this._parser = new Parser(function(err, obj) {
    if (err) {
      // @todo: Close the connection.
      return self.emit('error', err);
    }
    
    // @todo: Validate the object for conformance to JSON-RPC spec.
    // @fixme: Requests with an integer id of '0' are not getting disptached.  This
    //         is most likely due to a failing if statement.
    if (obj.result || obj.error) {
      self.emit('response', obj);
    } if (obj.id) {
      self.emit('request', obj);
    } else {
      self.emit('notification', obj);
    }
  });
}

util.inherits(Connection, events.EventEmitter);

Connection.prototype.connect = function(port, host, callback) {
  this._socket.connect(port, host, callback);
}

Connection.prototype.send = function(obj) {
  console.log('xmit:' + JSON.stringify(obj));
  this._socket.write(JSON.stringify(obj));
}


module.exports = Connection;
