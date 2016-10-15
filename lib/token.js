/*global require, Promise*/
'use strict';

var request = require('request');

var common = require('./common');
var logger = require('./log.js');
var token = require('./token-mgr/wechat-token');

function log(str) {
    logger.info(str);
}

function request_token(option) {
    log('Request Token ...');
    return new Promise(function (resolve, reject) {
        token.get_token({})
        .then(function(x) {
            if (x && x.access_token) {
                option.token = x.access_token;
                log('Got Token ' + x.access_token);
                resolve(option);
            } else {
                reject(new Error('NoToken'));
            }
        })
        .catch(reject);
    });
}

module.exports = {
    get_token: request_token
}
