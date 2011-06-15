var Server = require('./server');
var Client = require('./client');

exports.createServer = function(sessionListener) {
  return new Server(sessionListener);
};

exports.createClient = function() {
  return new Client();
};
