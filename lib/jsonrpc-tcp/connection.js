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
 * Examples:
 *
 *     var connection = new Connection();
 *
 * @return {Connection}
 * @api public
 */
function Connection(socket) {
  var self = this;
  this._methods = {};
  
  events.EventEmitter.call(this);
  this._socket = socket || new net.Socket();
  this._socket.setEncoding('utf8');
  this._socket.addListener('connect', function() {
    var remote = new Remote(self);
    self.emit('connect', remote);
  });
  this._socket.addListener('data', function(data) {
    console.log('recv:' + data);
    self._parser.parse(data);
  });
  this._socket.addListener('end', this.emit.bind(this, 'end'));
  this._socket.addListener('timeout', this.emit.bind(this, 'timeout'));
  this._socket.addListener('drain', this.emit.bind(this, 'drain'));
  this._socket.addListener('error', this.emit.bind(this, 'error'));
  this._socket.addListener('close', this.emit.bind(this, 'close'));
  
  this._parser = new jsonsp.Parser(function(err, obj) {
    if (err) {
      // @todo: Close the connection.
      return self.emit('error', err);
    }
    
    // @todo: Validate the object for conformance to JSON-RPC spec.
    // @fixme: Requests with an integer id of '0' are not getting disptached.  This
    //         is most likely due to a failing if statement.
    // @fixme: If both result and error ar null, the response isn't dispatched.
    if (obj.result || obj.error) {
      self.emit('response', obj);
    } else if (obj.method) {
      self.emit('request', obj);
      self._handleRequest(obj);
    }
    
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
  });
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
 * @param {String} name
 * @param {Function|Object} service
 * @api public
 */
Connection.prototype.expose = function(name, service) {
  if (typeof service == 'object') {
    var self = this;
    Object.keys(service).forEach(function (key) {
      self._methods[name + '.' + key] = service[key];
    });
  } else if (typeof service == 'function') {
    this._methods[name] = service;
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

Connection.prototype.send = function(obj) {
  console.log('xmit:' + JSON.stringify(obj));
  this._socket.write(JSON.stringify(obj));
}

Connection.prototype.end = function() {
  console.log('end');
  this._socket.end();
}

Connection.prototype._handleRequest = function(req) {
  var self = this;
  
  // @todo: Implement request validation.
  var method = self._methods[req.method];
  if (typeof method == 'function') {
    var params = req.params || [];
    
    function result(err, res) {
      // @todo: Implement error handling.
      if (req.id) {
        // @todo: Suppress responses to notifications, paying attention to
        //        session-level requests and error handling.
        self.send({ id: req.id, result: res, error: null })
      }
    }
    
    // Push result function as the last argument
    params.push(result);

    // Invoke the method
    try {
      method.apply(this, params);
    } catch (err) {
      console.error(err.stack + '\n');
      result(err);
    }
  } else {
    self.send({ id: req.id, result: null, error: 'Method Not Found' });
  }
}


module.exports = Connection;
