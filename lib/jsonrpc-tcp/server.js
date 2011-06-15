var events = require('events');
var net = require('net');
var util = require('util');
var Connection = require('./connection');

function Server(sessionFunc) {
  var self = this;
  
  events.EventEmitter.call(this);
  this._server = net.createServer();
  this._methods = {};
  this._connections = [];
    
  this._server.addListener('connection', function(socket) {
    var connection = new Connection(socket, sessionFunc);
    self._connections.push(connection);
    
    connection.addListener('close', function() {
      var idx = self._connections.indexOf(connection);
      self._connections.splice(idx, 1);
      connection = null;
    });
    
    connection.addListener('request', function(rpc) {
      // @todo: Implement request validation.
      var method = self._methods[rpc.method];
      if (typeof method == 'function') {
        var params = rpc.params;
        
        function result(err, res) {
          // @todo: Implement error handling.
          connection.send({ id: rpc.id, result: res, error: null })
        }
        
        // Push result function as the last argument
        params.push(result);

        // Invoke the method
        try {
          method.apply(this, params);
        } catch (err) {
          result(err);
        }
      } else {
        connection.send({ id: rpc.id, result: null, error: 'Method Not Found' });
      }
    });
    
    // @todo: Implement notification handling.
    /*
    connection.addListener('notification', function(rpc) {
      var method = self._methods[rpc.method];
      if (typeof method == 'function') {
        
      }
      // Responses aren't delivered for notifications, so any errors taht occur
      // a silent from the client's perspective.
    });
    */
    
    self.emit('connection', connection);
  });
}

util.inherits(Server, events.EventEmitter);

Server.prototype.listen = function(port, host, callback) {
  this._server.listen(port, host, callback);
}

Server.prototype.expose = function(name, service) {
  if (typeof service == 'object') {
    var self = this;
    Object.keys(service).forEach(function (key) {
      self._methods[name + '.' + key] = service[key];
    });
  } if (typeof service == 'function') {
    this._methods[name] = service;
  }
}


module.exports = Server;
