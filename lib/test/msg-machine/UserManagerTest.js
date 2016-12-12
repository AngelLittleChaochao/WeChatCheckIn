var assert = require('assert');
var redis = require('redis');
var UserManager = require('../../msg-machine/UserManager');
var rediscli = require('../../redis-cli');

var user_redis = rediscli.getConn();
describe('UserManager test', function() {

    it('add user', function (done) {
        var manager = new UserManager(user_redis);

        // change your own user id and nickname.
        // manager.addUser({id: 'testid', nickname: 'test'})
        // manager.addUser({id: 'oEcjCvi_1kIWqbLen--vmG4aDBxI', nickname: '超超'})
        // manager.addUser({id: 'oEcjCvmjTW0bgA1RX15QMlayfSCA', nickname: '按时间'})
        manager.addUser({id: 'oEcjCvsZEQ2ksdGSG14A5vhZengc', nickname: '宁'})
        .then(function (res) {
            console.info(res);
            done();
        })
        .catch(function (e) {
            console.info(e);
        })
    });

    it('get all users', function (done) {
        var manager = new UserManager(user_redis);
        manager.getAllUsers()
        .then(function (res) {
            console.log('result');
            console.info(res);
            done();
        })
        .catch(function (e) {
            console.info(e);
        })
    });
});
