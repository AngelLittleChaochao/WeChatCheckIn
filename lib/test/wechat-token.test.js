var mocha = require('mocha');
var assert = require('assert');

var bluebird = require("bluebird");
var redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);

var token = require('../token-mgr/wechat-token');
var common = require('../common');

var leader_key = common.leader_key, token_key = common.token_key;

var port = 6379, host = '127.0.0.1';
var redis_store = redis.createClient(port, host, {});

describe('leader_key not exist, ', function () {
    this.timeout(3000);

    it('token_key not exist', function (done) {
        redis_store.delAsync(leader_key)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.delAsync(token_key)
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token != null);
            assert(x.expire_time > Date.now()/1000);
            done();
        })
        .catch(function(e) {
            console.info(e);
        })
    });

    it('token_key expired', function (done) {
        var tokenobj = {
            access_token: '123456',
            expire_time: 100
        };

        redis_store.delAsync(leader_key)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.setAsync(token_key, JSON.stringify(tokenobj))
                .then(function(x) {
                    return {};
                })
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token != null);
            assert(x.expire_time > Date.now()/1000);
            done();
        })
        .catch(function(e) {
            console.log(e.message + '\n' + e.stack);
        })
    });

    it('token_key not expired', function (done) {
        var options = {
            'appid' : process.env.appid,
            'secret' : process.env.secret
        };

        var tokenobj = {
            access_token: '123456',
            expire_time: Date.now()/1000 + 1000
        };

        redis_store.delAsync(leader_key)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.setAsync(token_key, JSON.stringify(tokenobj))
                .then(function(x) {
                    return {};
                })
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token === '123456')
            done();
        })
        .catch(function(e) {
            console.log(e.message + '\n' + e.stack);
        })
    });

});

describe('leader_key exist and timeout, ', function () {
    this.timeout(3000);

    it('token_key not exist', function (done) {
        // 10 minutes ago
        redis_store.setAsync(leader_key, Date.now() - 10 * 60 * 1000)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.delAsync(token_key)
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token != null);
            assert(x.expire_time > Date.now()/1000);
            done();
        })
        .catch(function(e) {
            console.info(e);
        })
    });

    it('token_key expired', function (done) {
        var tokenobj = {
            access_token: '123456',
            expire_time: 100
        };

        redis_store.setAsync(leader_key, Date.now() - 10 * 60 * 1000)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.setAsync(token_key, JSON.stringify(tokenobj))
                .then(function(x) {
                    return {};
                })
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token != null);
            assert(x.expire_time > Date.now()/1000);
            done();
        })
        .catch(function(e) {
            console.log(e.message + '\n' + e.stack);
        })
    });

    it('token_key not expired', function (done) {
        var tokenobj = {
            access_token: '123456',
            expire_time: Date.now()/1000 + 1000
        };

        redis_store.setAsync(leader_key, Date.now() - 10 * 60 * 1000)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.setAsync(token_key, JSON.stringify(tokenobj))
                .then(function(x) {
                    return {};
                })
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token === '123456')
            done();
        })
        .catch(function(e) {
            console.log(e.message + '\n' + e.stack);
        })
    });

});

describe('leader_key exist but not timeout, ', function () {
    this.timeout(3000);

    it('token_key not exist', function (done) {
        setTimeout(function () {
            // has expired
            redis_store.setAsync(leader_key, Date.now() - 10 * 60 * 1000)
            .then(token.get_token)
            .catch(function(e) {
                console.log(e.message + '\n' + e.stack);
            });
        }, 500);

        // 10 minutes ago
        redis_store.setAsync(leader_key, Date.now() + 10 * 60 * 1000)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.delAsync(token_key)
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token != null);
            assert(x.expire_time > Date.now()/1000);
            done();
        })
        .catch(function(e) {
            console.info(e);
        })
    });

    it('token_key expired', function (done) {
        setTimeout(function () {
            // has expired
            redis_store.setAsync(leader_key, Date.now() - 10 * 60 * 1000)
            .then(token.get_token)
            .catch(function(e) {
                console.log(e.message + '\n' + e.stack);
            });
        }, 500);

        var tokenobj = {
            access_token: '123456',
            expire_time: 100
        };

        redis_store.setAsync(leader_key, Date.now() + 10 * 60 * 1000)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.setAsync(token_key, JSON.stringify(tokenobj))
                .then(function(x) {
                    return {};
                })
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token != null);
            assert(x.expire_time > Date.now()/1000);
            done();
        })
        .catch(function(e) {
            console.log(e.message + '\n' + e.stack);
        })
    });

    it('token_key not expired', function (done) {
        var tokenobj = {
            access_token: '123456',
            expire_time: Date.now()/1000 + 1000
        };

        redis_store.setAsync(leader_key, Date.now() + 10 * 60 * 1000)
        .then(function(x) {
            return new Promise(function(resolve, reject) {
                redis_store.setAsync(token_key, JSON.stringify(tokenobj))
                .then(function(x) {
                    return {};
                })
                .then(resolve)
                .catch(reject);
            });
        })
        .then(token.get_token)
        .then(function(x) {
            assert(x.access_token === '123456')
            done();
        })
        .catch(function(e) {
            console.log(e.message + '\n' + e.stack);
        })
    });

});
