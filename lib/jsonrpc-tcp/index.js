/**
 * Module dependencies.
 */
var Server = require('./server')
  , Connection = require('./connection');

/**
 * Framework version.
 */
require('pkginfo')(module, 'version');


/**
 * Create a new JSON-RPC server.
 *
 * Creates a new JSON-RPC over TCP server.  The optional `clientListener`
 * argument is automatically set as a listener for the 'client' event.
 *
 * Examples:
 *
 *     var server = jsonrpc.createServer();
 *
 *     var server = jsonrpc.createServer(function(client, remote) {
 *       remote.call('echo', 'Hello Client!');
 *     });
 *
 * @param {Function} clientListener
 * @return {Server}
 * @api public
 */
exports.createServer = function(clientListener) {
  return new Server(clientListener);
};

/**
 * Create a new JSON-RPC client.
 *
 * Examples:
 *
 *     var server = jsonrpc.createClient();
 *
 * @return {Connection}
 * @api public
 */
exports.createClient = function() {
  return new Connection();
};


/**
 * Expose constructors.
 */
exports.Server = Server;
exports.Connection = Connection;
