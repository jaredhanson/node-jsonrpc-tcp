/**
 * Module dependencies.
 */
var Server = require('./server')
  , Connection = require('./connection');

exports.createServer = function(clientListener) {
  return new Server(clientListener);
};

exports.createClient = function() {
  return new Connection();
};
