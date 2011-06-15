require.paths.unshift('../lib');
var jsonrpc = require('jsonrpc-tcp');


function echo(msg) { 
    return msg;
}

var Math = {
    add: function (a, b) { return a + b; }
}

var server = jsonrpc.createServer();
server.expose('echo', echo);
server.expose('math', Math);
server.listen(7000);
