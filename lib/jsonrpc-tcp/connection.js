/**
 * Module dependencies.
 */
var events = require('events')
  , net = require('net')
  , jsonsp = require('jsonsp')
  , util = require('util')
  , Remote = require('./remote');


/**
 * Create a new JSON-RPC connection.
 *
 * Creates a new JSON-RPC over TCP connection.  The optional `socket` argument
 * is used to create a connection on an existing socket, otherwise a new socket
 * will be allocated.
 *
 * Events:
 *
 *   Event: 'connect'
 *
 *     `function(remote) { }`
 *
 *   Emitted when a connection is established to a server.  `remote` is a
 *   `Remote`, to be used for invoking remote methods on the server.
 *
 *   Event: 'request'
 *
 *     `function(req) { }`
 *
 *   Emitted when a request (method invocation) is received on the connection.
 *
 *   Event: 'response'
 *
 *     `function(res) { }`
 *
 *   Emitted when a response (to a method invocation) is received on the
 *   connection.
 *
 *   Event: 'notification'
 *
 *     `function(notif) { }`
 *
 *   Emitted when a notification is received on the connection.
 *
 *   Event: 'error'
 *
 *     `function(err) { }`
 *
 *   Emitted when an error occurs.
 *
 * Examples:
 *
 *     var connection = new Connection();
 *
 * @return {Connection}
 * @api public
 */
function Connection(socket) {
  var self = this;
  
  events.EventEmitter.call(this);
  this._methods = {};
  this._socket = socket || new net.Socket();
  this._socket.setEncoding('utf8');
  this._socket.addListener('connect', function() {
    var remote = new Remote(self);
    self.emit('connect', remote);
  });
  this._socket.addListener('data', function(data) {
    //console.log('RECV: ' + data);
    self._parser.parse(data);
  });
  this._socket.addListener('end', this.emit.bind(this, 'end'));
  this._socket.addListener('timeout', this.emit.bind(this, 'timeout'));
  this._socket.addListener('drain', this.emit.bind(this, 'drain'));
  this._socket.addListener('error', this.emit.bind(this, 'error'));
  this._socket.addListener('close', this.emit.bind(this, 'close'));
  
  this._parser = new jsonsp.Parser(function(obj) {
    if (obj.result !== undefined || obj.error !== undefined) {
      self.emit('response', obj);
    } else if (obj.id !== null) {
      self.emit('request', obj);
      self._handleRequest(obj);
    } else {
      self.emit('notification', obj);
      self._handleRequest(obj);
    }
  });
  this._parser.addListener('error', function(err) {
    self._socket.destroy();
    self.emit('error', err);
  })
}

/**
 * Inherit from `events.EventEmitter`.
 */
util.inherits(Connection, events.EventEmitter);

/**
 * Expose a service.
 *
 * Examples:
 *
 *     connection.expose('echo', function(text, result) {
 *       return result(null, text);
 *     });
 *
 *     var service = {
 *       add: function (x, y) { return result(null, x + y) },
 *       subtract: function (x, y) { return result(null, x - y) }
 *     }
 *     connection.expose('math', service);
 *
 * @param {String} name
 * @param {Function|Object} service
 * @api public
 */
Connection.prototype.expose = function(name, service) {
  if (!service && typeof name == 'object') {
    service = name;
    name = null;
  }
  
  if (typeof service == 'function') {
    this._methods[name] = service;
  } else if (typeof service == 'object') {
    var self = this;
    var module = name ? name + '.' : '';
    for (var method in service) {
      if (typeof service[method] === 'function') {
        self._methods[module + method] = service[method].bind(service);
      }
    }
  }
}

/**
 * Open a connection to the given `host` and `port`.
 *
 * The callback parameter will be added as an listener for the 'connect' event.
 *
 * Examples:
 *
 *     client.connect(3001);
 *
 *     client.connect(3001, 'jsonrpc.example.com');
 *
 *     client.connect(7000, function(remote) {
 *       remote.call('echo', 'Hello World', function(err, result) {
 *         console.log(result);
 *       });
 *     });
 *
 * @param {Number} port
 * @param {String} host
 * @param {Function} callback
 * @api public
 */
Connection.prototype.connect = function(port, host, callback) {
  if ('function' == typeof host) {
      callback = host;
      host = null;
  }

  if (callback) { this.addListener('connect', callback); }
  this._socket.connect(port, host);
}

/**
 * Send `obj` over the connection.
 *
 * The `obj` being sent will be serialized to a UTF-8 string using
 * `JSON.stringify` before being transmitted on the socket.
 *
 * Examples:
 *
 *     connection.send({ method: "echo", params: ["Hello JSON-RPC"], id: 1 });
 *
 * @param {Object} obj
 * @api public
 */
Connection.prototype.send = function(obj) {
  //console.log('XMIT: ' + JSON.stringify(obj));
  this._socket.write(JSON.stringify(obj));
}

/**
 * Close the connection.
 *
 * Examples:
 *
 *     connection.end();
 *
 * @api public
 */
Connection.prototype.end = function() {
  this._socket.end();
}

/**
 * Handle request.
 *
 * @api private
 */
Connection.prototype._handleRequest = function(req) {
  var self = this;
  
  function result(err, res) {
    // requests without an id are notifications, to which responses are
    // supressed
    if (req.id !== null) {
      if (err) { return self.send({ id: req.id, result: null, error: err.message }); }
      self.send({ id: req.id, result: res, error: null })
    }
  }
  
  var method = self._methods[req.method];
  if (typeof method == 'function') {
    var params = req.params || [];

    // push result function as the last argument
    params.push(result);

    // invoke the method
    try {
      method.apply(this, params);
    } catch (err) {
      result(err);
    }
  } else {
    result(new Error('Method Not Found'));
  }
}


/**
 * Export `Connection`.
 */
module.exports = Connection;
