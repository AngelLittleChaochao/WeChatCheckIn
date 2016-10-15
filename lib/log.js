var log4js = require('log4js');

log4js.configure({
  appenders: [
    { type: 'console' } 
  ]
});

var logger = log4js.getLogger('normal');
logger.setLevel('INFO');

module.exports =  logger;

