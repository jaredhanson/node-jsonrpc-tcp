var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var Connection = require('jsonrpc-tcp/connection');
var Remote = require('jsonrpc-tcp/remote');


function MockSocket() {
  events.EventEmitter.call(this);
  this._buffer = '';
}

util.inherits(MockSocket, events.EventEmitter);

MockSocket.prototype.write = function(data) {
  this._buffer += data;
}

MockSocket.prototype.destroy = function() {
  this._destroyed = true;
}

MockSocket.prototype.setEncoding = function(encoding) {
}


vows.describe('Connection').addBatch({
  
  'connection with a function exposed as a service': {
    topic: function() {
      var connection = new Connection();
      connection.expose('noop', function(){});
      return connection;
    },
    
    'should expose service correctly' : function(err, connection) {
      assert.lengthOf(Object.keys(connection._methods), 1);
      assert.isFunction(connection._methods['noop']);
    },
  },
  
  'connection with an object exposed as a service': {
    topic: function() {
      var service = {
        add: function () {},
        subtract: function () {}
      }
      
      var connection = new Connection();
      connection.expose('math', service);
      return connection;
    },
    
    'should expose service correctly' : function(err, connection) {
      assert.lengthOf(Object.keys(connection._methods), 2);
      assert.isFunction(connection._methods['math.add']);
      assert.isFunction(connection._methods['math.subtract']);
    },
  },
  
  'connection with an object exposed as a service without a module name': {
    topic: function() {
      var service = {
        ping: function () {},
        pong: function () {}
      }
      
      var connection = new Connection();
      connection.expose(service);
      return connection;
    },
    
    'should expose service correctly' : function(err, connection) {
      assert.lengthOf(Object.keys(connection._methods), 2);
      assert.isFunction(connection._methods['ping']);
      assert.isFunction(connection._methods['pong']);
    },
  },

  'connection that connects': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('connect', function(remote) {
        self.callback(null, connection, remote);
      });
      
      process.nextTick(function () {
        connection._socket.emit('connect');
      });
    },
    
    'should emit a remote' : function(err, connection, remote) {
      assert.instanceOf(connection, Connection);
      assert.instanceOf(remote, Remote);
    },
  },
  
  'connection that receives a request invoking a known method': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.expose('echo', function(msg, done) {
        done(null, msg);
        self.callback(null, connection);
        return;
      });
      connection.on('request', function(req) {
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": 1}');
      });
    },
    
    'should send a result response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '{"id":1,"result":"Hello JSON-RPC","error":null}');
    },
  },
  
  'connection that receives a request invoking a known method with multiple parameters': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.expose('add', function(x, y, done) {
        done(null, x + y);
        self.callback(null, connection);
        return;
      });
      connection.on('request', function(req) {
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "add", "params": [3, 2], "id": 1}');
      });
    },
    
    'should send a result response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '{"id":1,"result":5,"error":null}');
    },
  },
  
  'connection that receives a request invoking a known method that encounters an error': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.expose('echo', function(msg, done) {
        done(new Error('something went wrong'));
        self.callback(null, connection);
        return;
      });
      connection.on('request', function(req) {
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": 1}');
      });
    },
    
    'should send an error response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '{"id":1,"result":null,"error":"something went wrong"}');
    },
  },
  
  'connection that receives a request with id 0 invoking a known method': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.expose('echo', function(msg, done) {
        done(null, msg);
        self.callback(null, connection);
        return;
      });
      connection.on('request', function(req) {
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": 0}');
      });
    },
    
    'should send a result response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '{"id":0,"result":"Hello JSON-RPC","error":null}');
    },
  },
  
  'connection that receives a request invoking an unknown method': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('request', function(req) {
        self.callback(null, connection);
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": 1}');
      });
    },
    
    'should send an error response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '{"id":1,"result":null,"error":"Method Not Found"}');
    },
  },
  
  'connection that receives a notification invoking a known method': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.expose('echo', function(msg, done) {
        done(null, msg);
        self.callback(null, connection);
        return;
      });
      connection.on('notification', function(notif) {
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": null}');
      });
    },
    
    'should not send a response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '');
    },
  },
  
  'connection that receives a notification invoking a known method that encounters an error': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.expose('echo', function(msg, done) {
        done(new Error('something went wrong'));
        self.callback(null, connection);
        return;
      });
      connection.on('notification', function(notif) {
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": null}');
      });
    },
    
    'should not send a response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '');
    },
  },
  
  'connection that receives a notification invoking an unknown method': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('notification', function(notif) {
        self.callback(null, connection);
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "method": "echo", "params": ["Hello JSON-RPC"], "id": null}');
      });
    },
    
    'should not send a response' : function(err, connection) {
      assert.equal(connection._socket._buffer, '');
    },
  },
  
  'connection that receives a response': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('response', function(res) {
        self.callback(null, connection, res);
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "result": "Hello JSON-RPC", "error": null, "id": 1}');
      });
    },
    
    'should emit response' : function(err, connection, res) {
      assert.equal(res.id, 1);
      assert.equal(res.result, 'Hello JSON-RPC');
      assert.isNull(res.error);
    },
  },
  
  'connection that receives an error response': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('response', function(res) {
        self.callback(null, connection, res);
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "result": null, "error": "Internal Server Error", "id": 1}');
      });
    },
    
    'should emit response' : function(err, connection, res) {
      assert.equal(res.id, 1);
      assert.isNull(res.result);
      assert.equal(res.error, "Internal Server Error");
    },
  },
  
  'connection that receives a response with both result and error set to null': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('response', function(res) {
        self.callback(null, connection, res);
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', '{ "result": null, "error": null, "id": 1}');
      });
    },
    
    'should emit response' : function(err, connection, res) {
      assert.equal(res.id, 1);
      assert.isNull(res.result);
      assert.isNull(res.error);
    },
  },
  
  'connection that receives invalid data': {
    topic: function() {
      var self = this;
      var connection = new Connection(new MockSocket());
      connection.on('error', function(err) {
        self.callback(null, connection, err);
      });
      
      process.nextTick(function () {
        connection._socket.emit('data', 'ABCP');
      });
    },
    
    'should destroy socket' : function(err, connection, err) {
      assert.isTrue(connection._socket._destroyed);
    },
    'should emit error' : function(err, connection, err) {
      assert.isNotNull(err);
    },
  },
  
  'connection that sends objects': {
    topic: function() {
      var connection = new Connection(new MockSocket());
      connection.send({ result: "Hello JSON-RPC", error: null, id: 1});
      return connection;
    },
    
    'should serialize objects as JSON strings' : function(err, connection) {
      assert.equal(connection._socket._buffer, '{"result":"Hello JSON-RPC","error":null,"id":1}');
    },
  },
  
}).export(module);
