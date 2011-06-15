var Server = require('./server');

exports.createServer = function(sessionFunc) {
  return new Server(sessionFunc);
};
