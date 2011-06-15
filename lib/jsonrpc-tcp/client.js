var events = require('events');
var util = require('util');
var Connection = require('./connection');
var Remote = require('./remote');

function Client() {
  var self = this;
  
  events.EventEmitter.call(this);
  this._connection = new Connection();
  this._connection.addListener('connect', function() {
    var remote = new Remote(self._connection);
    self.emit('connect', remote);
  });
  this._connection.addListener('close', self.emit.bind(self, 'close'));
}

util.inherits(Client, events.EventEmitter);

Client.prototype.connect = function(port, host, callback) {
  if ('function' == typeof host) {
      callback = host;
      host = null;
  }
  
  if (callback) { this.addListener('connect', callback); }
  this._connection.connect(port, host);
}


module.exports = Client;
