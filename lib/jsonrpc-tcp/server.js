/**
 * Module dependencies.
 */
var net = require('net')
  , util = require('util')
  , Connection = require('./connection');


/**
 * Create a new JSON-RPC server.
 *
 * Creates a new JSON-RPC over TCP server.  The optional `clientListener`
 * argument is automatically set as a listener for the 'client' event.
 *
 * Events:
 *
 *   Event: 'client'
 *
 *     `function(client, remote) { }`
 *
 *   Emitted when a client connects to the server.  `client` is a `Connection`,
 *   exposing services which can be invoked by the client on the server.
 *   `remote` is a `Remote`, to be used for invoking remote methods on the
 *   client from the server.
 *
 * Examples:
 *
 *     var server = new Server();
 *
 *     var server = new Server(function(client, remote) {
 *       remote.call('hello', 'Hello Client');
 *     });
 *
 * @param {Function} clientListener
 * @return {Server}
 * @api public
 */
function Server(clientListener) {
  net.Server.call(this);
  this._services = [];
  
  if (clientListener) { this.addListener('client', clientListener); }
  
  var self = this;
  this.addListener('connection', function(socket) {
    var connection = new Connection(socket);
    connection.once('connect', function(remote) {
      self.emit('client', connection, remote);
    });
    connection.on('error', function(err) {
      self.emit('clientError', err, this);
    });
    
    // Services exposed on the server as a whole are propagated to each
    // connection.  Flexibility exists to expose services on a per-connection
    // basis as well.
    self._services.forEach(function(service) {
      connection.expose(service.name, service.service)
    });
  });
}

/**
 * Inherit from `net.Server`.
 */
util.inherits(Server, net.Server);

/**
 * Expose a service.
 *
 * Examples:
 *
 *     server.expose('echo', function(text, result) {
 *       return result(null, text);
 *     });
 *
 * @param {String} name
 * @param {Function|Object} service
 * @api public
 */
Server.prototype.expose = function(name, service) {
  this._services.push({ name: name, service: service });
}


/**
 * Export `Server`.
 */
module.exports = Server;
