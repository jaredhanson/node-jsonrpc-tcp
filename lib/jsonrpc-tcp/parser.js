var yajl = require('yajl');
var util = require('util');

function Parser(callback) {
  this._handle = new yajl.Handle({
    allowMultipleValues : true
  });
  this._context = [];
  this._currentKey = null;
  this._callback = callback;
  
  var self = this;
  
  this._handle.addListener('startMap', function() {
    self._context.push({ key: self._currentKey, value: new Object() });
  });
  
  this._handle.addListener('endMap', function() {
    var ctx = self._context.pop();
    var len = self._context.length;
    if (0 == len) {
      self._callback(null, ctx.value);
    } else {
      addToContainer(self._context[len - 1].value, ctx.key, ctx.value);
    }
  });
  
  this._handle.addListener('startArray', function() {
    self._context.push({ key: self._currentKey, value: new Array() });
  });
  
  this._handle.addListener('endArray', function() {
    var ctx = self._context.pop();
    var len = self._context.length;
    if (0 == len) {
      // @todo: Determine if it is valid to have an array as a root-level object
      //        in JSON.  If so, invoke the callback here.
    } else {
      addToContainer(self._context[len - 1].value, ctx.key, ctx.value);
    }
  });
  
  this._handle.addListener('mapKey', function(key) {
    self._currentKey = key;
  });
  
  this._handle.addListener('null', function() {
    var len = self._context.length;
    addToContainer(self._context[len - 1].value, self._currentKey, null);
  });
  
  this._handle.addListener('boolean', function(flag) {
    var len = self._context.length;
    addToContainer(self._context[len - 1].value, self._currentKey, flag);
  });
  
  this._handle.addListener('number', function(n) {
    if ('string' == typeof n) {
      if (-1 == n.indexOf('.')) {
        n = parseInt(n);
      } else {
        n = parseFloat(n);
      }
    }
    var len = self._context.length;
    addToContainer(self._context[len - 1].value, self._currentKey, n);
  });
  
  this._handle.addListener('integer', function(i) {
    var len = self._context.length;
    addToContainer(self._context[len - 1].value, self._currentKey, i);
  });
  
  this._handle.addListener('double', function(f) {
    var len = self._context.length;
    addToContainer(self._context[len - 1].value, self._currentKey, f);
  });
  
  this._handle.addListener('string', function(s) {
    var len = self._context.length;
    addToContainer(self._context[len - 1].value, self._currentKey, s);
  });
  
  this._handle.addListener('error', function(err) {
    self._callback(err, null);
  });
}

Parser.prototype.parse = function(data) {
  this._handle.parse(data);
}

function addToContainer(container, key, val) {
  if (container instanceof Array) {
    container.push(val);
  } else if (container instanceof Object) {
    container[key] = val;
  }
}


module.exports = Parser;
