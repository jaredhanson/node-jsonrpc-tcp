/**
 * Create a new remote JSON-RPC peer over `connection`.
 *
 * `Remote` provides a convienient abstraction over a JSON-RPC connection,
 * allowing methods to be invoked and responses to be received asynchronously.
 *
 * A `Remote` instance will automatically be created for each connection.  There
 * is no need to do so manually.
 *
 * @api private
 */
function Remote(connection) {
  this.timeout = 5000;
  this._connection = connection;
  this._handlers = {};
  this._requestID = 1;
  
  var self = this;
  this._connection.addListener('response', function(res) {
    if (res.id === null || res.id === undefined) { return; }
    var handler = self._handlers[res.id];
    if (handler) { handler.call(self, res.error, res.result); }
    delete self._handlers[res.id];
  });
}

/**
 * Call a remote method.
 *
 * The method `name` will be invoked on the remote JSON-RPC peer, with given
 * arguments as `params`.  The optional `callback` will be called when the
 * response is received, carrying the `result` or `err` if an error occurred.
 *
 * Examples:
 *
 *     remote.call('echo', 'Hello World', function(err, result) {
 *       console.log(result);
 *     });
 *
 *     remote.call('math.add', 3, 2, function(err, result) {
 *       console.log(result);
 *     });
 *
 * @param {String} name
 * @param {Mixed} params
 * @param {Function} callback
 * @api public
 */
Remote.prototype.call = function(name, params, callback) {
  var params = Array.prototype.slice.call(arguments);
  var method = params.length ? params.shift() : null;
  var callback = (params.length && typeof params[params.length - 1] == 'function') ? params.pop() : null;

  var req = {
    id: this._requestID++,
    method: method,
    params: params
  }
  this._handlers[req.id] = callback;
  
  var self = this;
  setTimeout(function() {
    var handler = self._handlers[req.id];
    if (handler) { handler.call(self, new Error('Timed Out')); }
    delete self._handlers[req.id];
  }, this.timeout);
  
  this._connection.send(req);
}


/**
 * Export `Remote`.
 */
module.exports = Remote;
