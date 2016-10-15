var _ = require('highland');
var o2x = require('object-to-xml');
var bluebird = require("bluebird");
var redis = require('redis');
var request = require('request');

var MemQueue = require('../MemQueue');
var msg_xml = require('../msg-xml');
var msg_json = require('../msg-json');
var const_msg = require('../const-msg');
var UserManager = require('./UserManager');
var logger = require('../log');
var wxtoken = require('../token');
var common = require('../common');
var rediscli = require('../redis-cli');

bluebird.promisifyAll(redis.RedisClient.prototype);

var user_redis = rediscli.getConn();
var umanager = new UserManager(user_redis);

// process menu message
// {
// req : request data
// res : response
// rawdata : raw data
// in_msg : {}
// src_base : {from : .., to:..., type:...}
// dst_base : {from : ... , to: ...}
// }

common.process_msg_set.push('event_CLICK');
common.process_msg_set.push('event_VIEW');
console.info(common.process_msg_set);

var menuMachine = function () {

  var is_menu = function(x) {
    return x && x.src_base && x.src_base.type === 'event'
           && x.in_msg && x.in_msg.Event && (x.in_msg.Event[0] === 'CLICK' || x.in_msg.Event[0] === 'VIEW');
  }

  var has_resp = function(x) {
    return x.resp;
  }

  // menu process
  var response2 = function(x) {
    try {
        // mark process
      if (x.in_msg.EventKey && x.in_msg.EventKey[0] === 'mark') {
        var content = const_msg.repl_message.mark_success_curr;
        x.dst_base.type = 'text';
        x.dst_base.content = content;
        var res_content = msg_xml.create(x.dst_base);
        res_content = o2x(res_content);
        console.log('response message:' + res_content);
        x.resp.end(res_content);
      } else {
        x.resp.end();
      }

      return x;
    } catch (e) {
      x.resp.end();
      throw e;
    }
  }

  var notify_mark = function (source) {
      return source.consume(function(err, x, push, next) {
          if (err) {
              push(err, null);
              next();
          } else if (x === _.nil) {
              push(null, x);
          } else {
              logger.info('notify others...');
              var current = null;
              umanager.getAllUsers()
              .then(function (val) {
                  if (!val) {
                      return [];
                  } else {
                      current = JSON.parse(val[x.in_msg.FromUserName[0]]);
                      return Object.keys(val).map(function (key) {
                          return JSON.parse(val[key]);
                      });
                  }
              })
              .then(function (allusers) {
                  var cur_name = current ? current.nickname : '你的小伙伴';
                  console.log('all users:' + allusers);
                  console.info(allusers);
                  return allusers.map(function (user) {
                      if (user.id === x.in_msg.FromUserName[0]) {
                          return Promise.resolve();
                      } else {
                          return new Promise(function(resolve, reject) {
                              console.info(user);
                              wxtoken.get_token({})
                              .then(function (token) {
                                  var out_msg = {
                                      to : user.id,
                                      type : 'text',
                                      content : cur_name + const_msg.repl_message.mark_success_others
                                  }
                                  var msg = msg_json.create(out_msg);
                                  console.info(msg);
                                  var options = {
                                      uri : common.add_query_str(common.url.msg_upload_url, {access_token: token.token}),
                                      method : 'POST',
                                      body  : JSON.stringify(msg)
                                  };

                                  request(options, function(err, resp, body) {
                                      if (err) {
                                          reject(err);
                                          //   throw err;
                                      } else if (resp.statusCode == 200) {
                                          try {
                                              var obj = JSON.parse(body);
                                              if (obj && obj.errcode == 0) {
                                                  // success
                                                  resolve();
                                              } else {
                                                  reject(new Error(body));
                                              }
                                          } catch(e) {
                                              reject(new Error(body));
                                          }
                                      } else {
                                          reject(new Error('statusCode:' + resp.statusCode));
                                      }
                                  });
                              })
                              .catch(reject);
                          });
                      }
                  })
              })
              .then(function (arr) {
                  return Promise.all(arr);
              })
              .then(function (res) {
                  console.log('message has sent');
              })
              .catch(function (e) {
                  console.log(e);
              });
          }
      });
  }

  var text_pipe = function() {
      return _.pipeline(
        _.filter(is_menu),
        _.filter(has_resp),
        _.tap(function(x) {console.log('menu pipeline');}),
        _.map(response2),
        notify_mark,
        _.errors(function(e){console.log('err: ' + e.message);})
      );
  }

  return {
      run : text_pipe
  };
}


var queue = new MemQueue(common.msg_queue_id);

queue.subscribe(function(err, data) {
  _([data])
  .pipe(menuMachine().run())
  .errors(function(e) {
    console.log(e.message + '\n' + e.stack);
  })
  .done(function(x){});
})
