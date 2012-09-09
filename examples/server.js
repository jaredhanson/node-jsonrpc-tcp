var jsonrpc = require('jsonrpc-tcp');


function echo(msg, result) { 
    return result(null, msg);
}

var Math = {
    add: function (a, b, result) { return result(null, a + b); }
}

var server = jsonrpc.createServer();
server.expose('echo', echo);
server.expose('math', Math);
server.listen(7000);
