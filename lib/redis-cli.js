var redis = require('redis');

var port = process.env.redis_port || 6379, host = process.env.redis_host || '127.0.0.1', key = process.env.redis_key;
var redis_option = {auth_pass: key, connect_timeout: 3*60*1000}; // 3 minutes to reconnect
var redis_cli = redis.createClient(port, host, redis_option);

console.log('host:' + host);

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


module.exports = {
    createNewConn : function (tagfordebug) {
        var user_redis = redis.createClient(port, host, redis_option);
        register_event(user_redis, tagfordebug);

        return user_redis;
    },

    getConn : function () {
        if (redis_cli) {
            return redis_cli;
        } else {
            redis_cli = redis.createClient(port, host, redis_option);
            register_event(redis_cli, 'PubRedis Conn');
            return redis_cli;
        }
    }
}
