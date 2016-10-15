var _ = require('highland');
var parseString = require('xml2js').parseString;
var o2x = require('object-to-xml');

var bluebird = require("bluebird");
var redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);

var ContextError = require('./ContextError');
var textM = require('./msg-machine/TextMachine');
var subM = require('./msg-machine/SubMachine');
var menuM= require('./msg-machine/MenuMachine');
var nonM = require('./msg-machine/NoneMachine');

var msg_xml = require('./msg-xml');

var MemQueue = require('./MemQueue');
var common = require('./common');
var rediscli = require('./redis-cli');

// event hub to store user log
var client = require('./eventlog');
var msg_queue = new MemQueue(common.msg_queue_id);

var store = rediscli.getConn();

var register_event = function(store, name) {
    store.on('reconnecting', function() {
        console.log(name + ' reconnecting ');
    });

    store.on('ready', function() {
        console.log(name + ' ready');
    });

    store.on("error", function (err) {
        console.log(name + " " + err);
    });
}

register_event(store, 'MsgRedis');

/**
* Duplicate Filter.
* Don't pass the same message multitimes
*
* for normal message : use MsgId to check duplication,
* for event message, use FromUserName + CreateTime
*/
var zset_key = 'z:msgset';

var whitelist = ['oXgZrwWOjCeNOsGsiWiZojaSS0mc', 'oXgZrwZqxq09FGhNJkZIop5JXdm0', 'oXgZrwfnu-eSD0kVmIZf1k8e2Wn8',
'oXgZrwefrYTGEtVMIUsRdWq6PND8', 'oXgZrwX5nouj3cBTgDPD12VsW6yY', 'oXgZrwSr1LZuIHhNpWN-_PFW_NrM', 'oXgZrwaXRZfuWM95lytawXnF3gZw', 'oXgZrwa0Ksdi3jSeOIsbj3xDwhi4', 'oXgZrwZQD6fGl2a2PU8mKnOyYrns'];
var whitelist_filer = function(source) {
    return source.consume(function(err, x, push, next) {
        if (err) {
            push(err, null);
            next();
        } else if (x === _.nil) {
            push(null, x);
        } else {
            console.log('from: ' + x.src_base.from);
            if (whitelist.indexOf(x.src_base.from) >= 0 ) {
                push(null, x);
                next();
            } else {
                var con_err = new ContextError('no_white', x);
                push(con_err);
                next();
            }
        }
    })
}


var duplicate_filter = function(source) {
    return source.consume(function(err, x, push, next) {
        if (err) {
            push(err, null);
            next();
        } else if (x === _.nil) {
            push(null, x);
        } else {
            var id ;
            var type = null;
            var fromUser = null;
            var createTime = null;
            try {
                type = x.in_msg.MsgType[0];
                fromUser = x.in_msg.FromUserName[0];
                createTime = x.in_msg.CreateTime[0];

                if (type === 'event') {
                    id = fromUser + '_' + createTime;
                } else {
                    id = x.in_msg.MsgId[0];
                }

                // try add (id, Date.now())
                store.zaddAsync([zset_key, Date.now(), id])
                .then(function(data) {
                    // no data is added, it meas the message is duplicated.
                    if (data === 0) {
                        var con_err = new ContextError('duplicated, id = ' + id, x);
                        push(con_err);
                        next();
                    } else {
                        push(null, x);
                        next();
                    }
                })
                .catch(function(err) {
                    var con_err = new ContextError(err.message, x);
                    push(con_err, null);
                    next();
                });
            } catch (e) {
                //maybe format error;
                var con_err = new ContextError(e.message, x);
                push(con_err, null);
                next();
            }
        }
    });
}


var _parse = function (source) {
    return source.consume(function (err, x, push, next) {
        if (err) {
            push(err, x);
            next();
        } else if (x === _.nil) {
            push(null, x);
        } else {
            try {
                parseString(x.rawdata, function (ex, data) {
                    if (ex) {
                        var con_err = new ContextError(ex.message, x);
                        push(con_err, null);
                        next();
                    } else if (data.xml === undefined) {
                        var con_err = new ContextError(x.rawdata, x);
                        push(con_err, null);
                        next();
                    } else {
                        x.in_msg = data.xml;
                        push(null, x);
                        next();
                    }
                });
            } catch(e) {
                var con_err = new ContextError(e.message, x);
                push(con_err, null);
                next();
            }
        }
    });
}

// add the base information of a message
var add_base_info = function (option) {
    try {
        var data = option.in_msg;
        option.src_base = {
            from : data.FromUserName[0],
            to : data.ToUserName[0],
            type : data.MsgType[0]
        }

        option.dst_base = {
            to : data.FromUserName[0],
            from : data.ToUserName[0],
        }
        return option;
    } catch (e) {
        var con_err = new ContextError(e.message, option);
        throw con_err;
    }
}

var _log_message = function(source) {
    return source.consume(function (err, x, push, next) {
        if (err) {
            push(err, x);
            next();
        } else if (x === _.nil) {
            push(null, x);
        } else {
            // log message without waiting
            try {
                var logdata = {
                    type : 'input',
                    body : x.in_msg
                }
                client.send(JSON.stringify(logdata), null, function(err, data) {
                    if (err) {
                        console.log('LOG ERROR : log user message error,' + err.message + ', ' + err.stack);
                    } else {
                        console.log('LOG SUCCESS');
                    }
                });
            } catch(e) {
                console.log('LOG ERROR : log user message error,' + e.message + ', ' + e.stack);
            }

            push(null, x);
            next();
        }
    });
}

var _msg_pub = function (source) {
    return source.consume(function (err, x, push, next) {
        if (err) {
            push(err, x);
            next();
        } else if (x === _.nil) {
            push(null, x);
        } else {
            msg_queue.publish(x, function(ex, data) {
                if (ex) {
                    push(new ContextError(ex.message), x);
                    next();
                } else {
                    push(null, x);
                    next();
                }
            });
        }
    });
}

var _add2queue = function() {
    return _.pipeline(
        _parse,
        _.map(add_base_info),
        // duplicate_filter,
        _msg_pub,
        _log_message,
        _.stopOnError(function(e) {
            console.log(e.message + '\n' + e.stack);
            try {
                if (e.message === 'no_white') {
                    console.log('the user are not in whitelist');
                    var x = e.context;
                    x.dst_base.type = 'text';
                    x.dst_base.content = '公众号尚未开放。谢谢你的关注';
                    var res_content = msg_xml.create(x.dst_base);
                    res_content = o2x(res_content);
                    console.log('response message:' + res_content);
                    e.context.resp.end(res_content);
                } else {
                    // close the connection;
                    e.context.resp.end();
                }
            } catch (ex) {
                console.log(ex.message);
            }
        })
    );
}

module.exports = _add2queue;
