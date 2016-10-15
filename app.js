
var _ = require('highland');
var express = require('express');
var app     = express();
var server  = require('http').createServer(app);
var parseString = require('xml2js').parseString;

var wechat_auth_http = require('./lib/http');
var msg_in = require('./lib/Msg-In');

var token = require('./lib/token-mgr/wechat-token');

var port = process.env.PORT || 3456;

//auth for the first time
app.use(wechat_auth_http);

app.post("/msg", function(req, res) {
  var rawData = "";
  req.on("data", function(data) {
      console.log('data:'+data);
      rawData += data;
  });

  req.on("end", function() {
    // res.end();
    var option = {
      rawdata : rawData,
      req : req,
      resp : res
    };

    _([option])
    .pipe(msg_in())
    // .errors(console.log)
    .each(function(x){});
  });
});

var appid = process.env.appid, secret = process.env.secret;
app.get("/token", function(req, res) {
    console.info(req.query);
    var query_id = req.query['appid'], query_secret = req.query['secret'];
    if (query_id && secret && (query_id === appid) && (query_secret === secret)) {
        token.get_token({})
        .then(function(x) {
            if (x && x.access_token) {
                console.log('get token: ' + x.access_token);
                res.end(JSON.stringify({access_token : x.access_token}));
            } else {
                res.end(JSON.stringify({error: 'get token error'}));
            }
        })
        .catch(function(e) {
            res.end(JSON.stringify({error: e.message}));
            console.log('Got token error');
        });
    } else {
        res.end(JSON.stringify({error: 'appid or secret error'}));
    }
});

// get token when server started
token.get_token({})
.then(console.info)
.catch(console.info);


server.listen(port, function () {
    console.log('Server listening at port %d', port);
  });
