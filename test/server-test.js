var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var Server = require('jsonrpc-tcp/server');
var Connection = require('jsonrpc-tcp/connection');
var Remote = require('jsonrpc-tcp/remote');


function MockSocket() {
  events.EventEmitter.call(this);
}

util.inherits(MockSocket, events.EventEmitter);

MockSocket.prototype.setEncoding = function(encoding) {
}


vows.describe('Server').addBatch({
  
  'server with services exposed': {
    topic: function() {
      var server = new Server();
      server.expose('noop', function(){});
      
      return server;
    },
    
    'when accepting a connection': {
      topic: function(server) {
        var self = this;
        server.on('client', function(connection, remote) {
          self.callback(null, connection, remote);
        });
        
        process.nextTick(function () {
          var socket = new MockSocket();
          server.emit('connection', socket);
          socket.emit('connect');
        });
      },
      
      'should emit a connection and a remote' : function(err, connection, remote) {
        assert.instanceOf(connection, Connection);
        assert.instanceOf(remote, Remote);
      },
      'should expose services on connection' : function(err, connection, remote) {
        assert.length(Object.keys(connection._methods), 1);
        assert.isFunction(connection._methods['noop']);
      },
    },
  },
  
}).export(module);
