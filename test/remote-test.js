var vows = require('vows');
var assert = require('assert');
var events = require('events');
var util = require('util');
var Remote = require('jsonrpc-tcp/remote');


function MockConnection() {
  events.EventEmitter.call(this);
}

util.inherits(MockConnection, events.EventEmitter);

MockConnection.prototype.send = function(obj) {
}


vows.describe('Remote').addBatch({
  
  'remote that receives a response': {
    topic: function() {
      var self = this;
      var connection = new MockConnection();
      var remote = new Remote(connection);
      remote.call('echo', 'Hello JSON-RPC', function(err, res) {
        self.callback(null, err, res);
      })
      
      process.nextTick(function () {
        connection.emit('response', { id: 1, result: 'Hello JSON-RPC', error: null });
      });
    },
    
    'should call callback with result' : function(err, e, res) {
      assert.equal(res, 'Hello JSON-RPC');
      assert.isNull(e);
    },
  },
  
  'remote that receives an error response': {
    topic: function() {
      var self = this;
      var connection = new MockConnection();
      var remote = new Remote(connection);
      remote.call('echo', 'Hello JSON-RPC', function(err, res) {
        self.callback(null, err, res);
      })
      
      process.nextTick(function () {
        connection.emit('response', { id: 1, result: null, error: 'Internal Server Error' });
      });
    },
    
    'should call callback with error' : function(err, e, res) {
      assert.equal(e, 'Internal Server Error');
      assert.isNull(res);
    },
  },
  
  'remote that does not receive a response before timeout': {
    topic: function() {
      var self = this;
      var connection = new MockConnection();
      var remote = new Remote(connection);
      remote.timeout = 500;
      remote.call('echo', 'Hello JSON-RPC', function(err, res) {
        self.callback(null, err, res);
      })
      
      // connection doesn't emit a response, causing an eventual timeout
    },
    
    'should call callback with error' : function(err, e, res) {
      assert.instanceOf(e, Error);
      assert.equal(e.message, 'Timed Out');
      assert.isUndefined(res);
    },
  },

}).export(module);
