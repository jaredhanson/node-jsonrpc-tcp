var net = require('net')
  , util = require('util')
  , Connection = require('./connection');


function Server(clientListener) {
  var self = this;
  
  net.Server.call(this);
  this._services = [];
  
  if (clientListener) { this.addListener('client', clientListener); }
  
  this.addListener('connection', function(socket) {
    var connection = new Connection(socket);
    connection.addListener('connect', function(remote) {
      self.emit('client', connection, remote);
    });
    
    // Services exposed on the server as a whole are propagated to each
    // connection.  Flexibility exists to expose services on a per-connection
    // basis as well.
    self._services.forEach(function(service) {
      connection.expose(service.name, service.service)
    });
  });
}

util.inherits(Server, net.Server);

Server.prototype.expose = function(name, service) {
  this._services.push({ name: name, service: service });
}


module.exports = Server;
