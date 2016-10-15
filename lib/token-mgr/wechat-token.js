/*global require, console, Promise */
'use strict';

var path = require('path');
var request = require('request');
var bluebird = require("bluebird");
var redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);

var common = require('../common');
var rediscli = require('../redis-cli');
var error = require('./error');

function log(obj) {
    console.info(obj);
}

var channel = common.channel_name, token_key = common.token_key, leader_key = common.leader_key, token_url = common.token_url_wx();
var debug_flag = false, event_queue = [], get_token_buffer = 5 * 60 * 1000; // 5 minutes, in milliseconds

var sub_redis = rediscli.createNewConn('sub redis'), pub_redis = rediscli.createNewConn('pub redis');

var init_sub_redis = function(store) {
    store.subscribe(channel);
    store.on("message", function (channel, message) {
        try {
            var token_obj = JSON.parse(message);
            log('Got Sub Message, Token : ' + token_obj.access_token);
            event_queue.forEach(function (item) {
                try {
                    item.res(token_obj);
                } catch (e) {
                    item.rej(e);
                }
            });
            event_queue = [];
        } catch (e) {
            log(e.message + '\n' + e.stack);
            log('sub redis message error');
        }
    });
};


init_sub_redis(sub_redis);

/** request token from network and set it to redis */
function update_token(option) {
    function request_token(option) {
        log('--Request Token ...');
        return new Promise(function (resolve, reject) {
            var url = token_url;
            log("--Request Token URL : " + url);
            try {
                request(url, function (err, response, body) {
                    if (err) {
                        reject(err);
                    } else {
                        var result = body, tokenObj = JSON.parse(result);
                        if (tokenObj.access_token && tokenObj.expires_in) {
                            if (debug_flag) {
                                tokenObj.expire_time = Date.now()/1000 + 300;
                            } else {
                                tokenObj.expire_time = Date.now()/1000 + tokenObj.expires_in;
                            }
                            option.token = tokenObj;
                            resolve(option);
                        } else {
                            reject(err);
                        }
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    function update_stored_token(option) {
        log('--Update Token To Storage');
        return new Promise(function(resolve, reject) {
            pub_redis.setAsync(token_key, JSON.stringify(option.token))
            .then(function(x) {
                return option;
            })
            .then(resolve)
            .catch(reject);
        });
    }

    function publish_token(option) {
        return new Promise(function(resolve, reject) {
            console.info(option.token);
            pub_redis.publishAsync(channel, JSON.stringify(option.token))
            .then(function(x) {
                return option;
            })
            .then(resolve)
            .catch(reject);
        });
    }


    return new Promise (function (resolve, reject ) {
        log('Step 3: Update Token');
        request_token(option)
        .then(update_stored_token)
        .then(publish_token)
        .then(resolve)
        .catch(reject);
    });
}

var try_set_token = function (opt) {
    log('Step 2: Try Set Token ...');

    var wait = function (para) {
        log('--Wait To Be Notified ...');
        event_queue.push(para);
    };

    var is_leader_expired = function (x) {
        // milliseconds since 1970
        var now = Date.now();
        if ((now - x) >= get_token_buffer) {
            return true;
        }

        return false;
    }

    var manage_leader_key = function (opt) {
        return new Promise(function(resolve, reject) {
            pub_redis.getAsync(leader_key)
            .then(function(x) {
                // check if expired
                if (is_leader_expired(x)) {
                    log('--Leader Expired');
                    pub_redis.delAsync(leader_key)
                    .then(function(item) {
                        // delete successfully
                        if (item === 1) {
                            log('--Leader Is deleted');
                            try_set_token(opt)
                            .then(resolve)
                            .catch(reject);
                        } else {
                            log('--Leader Not Deleted');
                            try_set_token(opt)
                            wait({res: resolve, rej: reject});
                        }
                    })
                    .catch(reject);
                } else {
                    log('--Leader Not Deleted');
                    wait({res: resolve, rej: reject});
                }
            });
        });
    }

    return new Promise(function(resolve, reject) {
        log('--Try Set Key: ' + leader_key);
        pub_redis.setnxAsync(leader_key, Date.now())
        .then(function(x) {
            if (x === 1) { // set success
                log('--Key Has been Set:' + leader_key);
                update_token({})
                .then(function(x) {
                    return x.token;
                })
                .then(resolve);
            } else { //
                log('--Check If Key Is Expired:' + leader_key);
                manage_leader_key(opt)
                .then(resolve)
                .catch(reject);
            }
        })
        .catch(reject);
    });
}


/**
 * Try get token, if it is expired, try update it.
 */
 var try_get_token = function(opt) {

     var wait = function(para) {
         log('--Wait To Be Notified ...');
         event_queue.push(para);
     }
     // return true, if token has expired
     var is_token_expired = function (tokenobj) {
         if (!tokenobj) {
             return { error : error.TokenNotExist };
         }

         if ((typeof tokenobj) === 'string') {
             tokenobj = JSON.parse(tokenobj);
         }

         if (!tokenobj || !tokenobj.expire_time || !tokenobj.access_token) {
             return { error : error.TokenFormatError };
         }

         var now = Date.now()/1000; // now in seconds
         console.log('(2 minutes buffer)time left in seconds : ' + (tokenobj.expire_time - now));
         // two minutes buffer
         if (now > tokenobj.expire_time - 120) { // need to update
             return { expired: true };
         }

         return { expired: false };
     }

     var manage_token = function(opt) {
         return new Promise(function(resolve, reject) {
             log('--Manage Token ...');

             var exp = is_token_expired(opt);
             if (exp.error === error.TokenNotExist) {
                 log('--Token Not Exist: ' + error.TokenNotExist);
                 try_set_token(opt)
                 .then(resolve)
                //  .catch(function(e) {
                //     log('Set Error') ;
                //  })
                 .catch(reject);
             } else if (exp.expired || exp.error) {
                 log('--Token Expired or Format Error');
                 pub_redis.delAsync(token_key)
                 .then(function(x) {
                     if (x === 1) { // deleted
                         log('--Token Has been Deleted');
                         try_set_token(opt)
                         .then(resolve)
                         .catch(reject);
                     } else {
                         wait({res: resolve, rej: reject});
                     }
                 })
                 .catch(reject);
             } else {
                 resolve(opt);
             }
         });
     }

     return new Promise(function (resolve, reject) {
         log('Step 1: Try Get Token ...');
         pub_redis.getAsync(token_key)
         .then(function(x) {
             if ((typeof x) === 'string') {
                 x = JSON.parse(x);
             }

             return x;
         })
         .then(manage_token)
         .then(resolve) // resolve if not expired
         .catch(reject);
     });
 }

//module.exports = get_token;
module.exports = {
    get_token : try_get_token
};
