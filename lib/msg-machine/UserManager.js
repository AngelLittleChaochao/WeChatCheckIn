var bluebird = require("bluebird");
var redis = require('redis');

var common = require('../common');

bluebird.promisifyAll(redis.RedisClient.prototype);


var users_key = common.users_key;

/**
 * user manager class to manager all users
 * @param {object} redis_obj []
 * @param {[type]} port [description]
 * @param {[type]} opt  [description]
 */
 function UserManager(redis_obj) {
     if (!redis_obj) {
         throw new Error('parameter is null');
     }
     this.redis_obj = redis_obj;
 }

//http://redis.io/commands/hgetall
/**
 * get all uesrs from storage
 *
 * @return {Promise} return promise, its data is like
 * {userid1: '{"id": "userid1", "nickname": "**"}', userid2: '{"id": "userid2", "nickname":"***"}'}
 */
 UserManager.prototype.getAllUsers = function () {
     var client = this.redis_obj;
     return new Promise(function (resolve, reject) {
         client.hgetallAsync(users_key)
         .then(function (x) {
             resolve(x);
         })
         .catch(function (e) {
             reject(e);
         });
     });

 }

/**
 * addUser to store
 * @param {[type]} userObj [description]
 */
 UserManager.prototype.addUser = function (userObj) {
     var client = this.redis_obj;
     return new Promise(function (resolve, reject) {
         if (!userObj || !userObj.id || !userObj.nickname) {
             reject(new Error('userObj or userObj.id or userObj.name is null'));
         } else {
             client.hmsetAsync(users_key, userObj.id, JSON.stringify(userObj))
             .then(function (x) {
                 resolve(x);
             })
             .catch(function (e) {
                 reject(e);
             });
         }
     });
 }

module.exports = UserManager;
