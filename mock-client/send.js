var request = require('request');
var fs = require('fs');

var azure_url = 'YOUR_REMOTE_SERVER_URL/msg'
var url = 'http://localhost:3456/msg';

//url = azure_url;

// node send.js file.xml azure
if (process.argv.length > 3) {
  if (process.argv[3] === 'azure') {
    url = azure_url;
  }
}

console.dir(process.argv)
fs.createReadStream(process.argv[2])
.pipe(request.post({url:url}, function(err, resp, body) {
    console.log('response : ');
    console.log(body);

}));
