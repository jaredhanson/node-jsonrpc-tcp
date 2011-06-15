require.paths.unshift('../lib');
var jsonrpc = require('jsonrpc-tcp');


var client = jsonrpc.createClient();
client.connect(7000, function(remote) {
  remote.call('echo', 'Hello World', function(err, result) {
    console.log(result);
  });
  remote.call('math.add', 3, 2.1, function(err, result) {
    console.log(result);
  });
});

client.addListener('close', function() {
});
