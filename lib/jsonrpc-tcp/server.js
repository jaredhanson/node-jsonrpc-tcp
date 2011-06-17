var events = require('events');
var net = require('net');
var util = require('util');
var Session = require('./session');
var Connection = require('./connection');

function Server(sessionListener) {
  var self = this;
  
  events.EventEmitter.call(this);
  this._server = net.createServer();
  this._methods = {};
  this._sessions = {};
  
  if (sessionListener) { this.addListener('session', sessionListener); }
  
  this._server.addListener('connection', function(socket) {
    var id = null;
    do {
      id = Math.floor(Math.random() * Math.pow(2,32)).toString(16);
    } while (self._sessions[id]);
    
    var connection = new Connection(socket);
    var session = new Session(id, connection);
    self._sessions[id] = session;
    
    session.addListener('request', function(req) {
      //console.log('server request: ' + req.method);
      
      // @todo: Implement request validation.
      var method = self._methods[req.method];
      if (typeof method == 'function') {
        var params = req.params;
        
        function result(err, res) {
          // @todo: Implement error handling.
          if (req.id) {
            // @todo: Suppress responses to notifications, paying attention to
            //        session-level requests and error handling.
            connection.send({ id: req.id, result: res, error: null })
          }
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
        connection.send({ id: req.id, result: null, error: 'Method Not Found' });
      }
    });
    
    session.addListener('close', function() {
      delete self._sessions[session.id];
      session = null;
    });
    
    // @todo: Implement notification handling.
    /*
    session.addListener('notification', function(rpc) {
      var method = self._methods[rpc.method];
      if (typeof method == 'function') {
        
      }
      // Responses aren't delivered for notifications, so any errors taht occur
      // a silent from the client's perspective.
    });
    */
    
    self.emit('session', session, session.remote);
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
  } else if (typeof service == 'function') {
    this._methods[name] = service;
  }
}


module.exports = Server;
