var restify = require('restify');
var http = require('http');


var workspace = require('./workspaceDeluxe.js')

//var auth = {token: "un=nconrad|tokenid=4c2636ee-ea75-11e3-9f1c-123139141556|expiry=1433263526|client_id=nconrad|token_type=Bearer|SigningSubject=https://nexus.api.globusonline.org/goauth/keys/0a96c21c-e821-11e3-ad3f-22000ab68755|sig=e830664e4f752337a8842206b3a2bd414f79034db722d200163619ce48d909a7aef5b3bdc5ddc6f564187fa49b7f052cc60a8fc9a24da09ed00597de75682c8e6c8b10d08bde50f74441a90f4e5aa5ffd04993290bbdc6880be1bb4d853be61aeb192d34445b30d1411e526a3d9d3a42717172b0fe44f995a593bdfebd46cc1f"}

//var kbws =  workspace.Workspace('http://kbase.us/services/workspace_deluxe', auth);


function respond(req, res, next) {
    var params = [{}]
    var method = "Workspace.list_workspace_info"
    var rpc = {
        params : params,
        method : method,
        version: "1.1",
        id: String(Math.random()).slice(2),
    };


    var options = {
        hostname: 'kbase.us',
        method: 'POST',
        path: '/services/ws',
        data: JSON.stringify(rpc)
    };
    console.log(JSON.stringify(options))


    var req = http.request(options, function(res) {
          console.log("statusCode: ", res.statusCode);
          console.log("headers: ", res.headers);

          res.on('data', function(d) {
            process.stdout.write(d);
          });
    });

    req.end();    

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });

    next();
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);

server.listen(8080,  'localhost', function() {
    console.log('%s listening at %s', server.name, server.url);
});