var events = require('events');
var util = require('util');
var Connection = require('./connection');
var Remote = require('./remote');

function Session(id, connection) {
  var self = this;
  
  events.EventEmitter.call(this);
  this.id = id;
  this._connection = connection;
  this._connection.addListener('request', function(req) {
    //console.log('session request: ' + req.method);
    
    // @todo: Implement request validation.
    var method = self._methods[req.method];
    if (typeof method == 'function') {
      var params = req.params;
      
      function result(err, res) {
        // @todo: Implement error handling.
        self._connection.send({ id: req.id, result: res, error: null })
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
      // Re-emit the request.  The server is listening for this event, in order
      // to handle globally registered services.
      self.emit('request', req);
    }
  });
  this._connection.addListener('close', self.emit.bind(self, 'close'));
  
  this._methods = {};
  this.remote = new Remote(this._connection);
}

util.inherits(Session, events.EventEmitter);

Session.prototype.expose = function(name, service) {
  if (typeof service == 'object') {
    var self = this;
    Object.keys(service).forEach(function (key) {
      self._methods[name + '.' + key] = service[key];
    });
  } else if (typeof service == 'function') {
    this._methods[name] = service;
  }
}


module.exports = Session;
