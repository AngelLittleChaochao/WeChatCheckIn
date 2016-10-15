var Queue = require('node-queue-lib/queue.core');

/**
 * memory queue
 */
function MemQueue(qid) {
  var queue = new Queue(qid, 'broadcast');

  function QueueInterface(){}

  QueueInterface.prototype.subscribe = function(push) {
    // subscribe on 'qid' messages
    queue.subscribe(function (err, subscriber) {
        subscriber.on('error', function(err){
           push(err, null);
        });
        subscriber.on('data', function (data, accept) {
          push(null, data);
          accept();
        });
      });
  }

  // unsubscribe
  QueueInterface.prototype.close = function(callback) {
    queue.close(function(){
        if (callback) {
          callback();
        }
    });
  }

  QueueInterface.prototype.publish = function(msg, callback) {
    queue.publish(msg, callback);
  }

  return new QueueInterface();
}

module.exports = MemQueue;
