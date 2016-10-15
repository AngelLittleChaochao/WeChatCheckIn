var MemQueue = require('../MemQueue');
var assert = require('assert')

process.env.TEST = true;

describe('MemQueue test', function() {

  it('pub/sub same queue and same id', function(done) {
    console.log('first');
      var qid = '123';
      var queue = new MemQueue(qid);
      queue.publish('hello world', function(){});
      queue.subscribe(function(err, data) {
        assert('hello world', data);
        queue.close();
        done();
      });
  });

  it('pub/sub two queue and same id', function(done) {
    console.log('second');
      var qid = '123';
      var queue_sub = new MemQueue(qid);
      var queue_pub = new MemQueue(qid);
      queue_pub.publish('hello world', function(){});
      queue_sub.subscribe(function(err, data) {
        assert('hello world', data);
        queue_sub.close();
        done();
      });
  });

  it('pub/sub object', function(done) {
    console.log('second');
      var qid = '123';
      var queue_sub = new MemQueue(qid);
      var queue_pub = new MemQueue(qid);
      queue_pub.publish({name:'hello world'}, function(){});
      queue_sub.subscribe(function(err, data) {
        assert('hello world', data.name);
        queue_sub.close();
        done();
      });
  });
});
