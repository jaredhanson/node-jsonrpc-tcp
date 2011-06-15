function Remote(connection) {
  this._connection = connection;
  this._handlers = {};
  this._requestID = 0;
  
  var self = this;
  this._connection.addListener('response', function(res) {
    if (!res.id) { return; }
    var handler = self._handlers[res.id];
    if (handler) { handler.call(self, res.error, res.result); }
    delete self._handlers[res.id];
  });
}

Remote.prototype.call = function() {
  var params = Array.prototype.slice.call(arguments);
  var method = params.length ? params.shift() : null;
  var callback = (params.length && typeof params[params.length - 1] == 'function') ? params.pop() : null;
  // @todo: Validate the method and params for conformance to JSON-RPC spec.

  var request = {
    id: this._requestID++,
    method: method,
    params: params
  }
  this._handlers[request.id] = callback;
  
  var self = this;
  setTimeout(function() {
    var handler = self._handlers[request.id];
    if (handler) { handler.call(self, new Error('Timed Out')); }
    delete self._handlers[request.id];
  }, 5000);  // @todo: Implement a configurable timeout.
  
  this._connection.send(request);
}


module.exports = Remote;
