var _ = require('highland');
var o2x = require('object-to-xml');

var MemQueue = require('../MemQueue');
var msg_xml = require('../msg-xml');
var const_msg = require('../const-msg');

var msg_json = require('../msg-json');
var common= require('../common');
var token = require('../token');



// process text message
// {
// req : request data
// res : response
// rawdata : raw data
// in_msg : {}
// src_base : {from : .., to:..., type:...}
// dst_base : {from : ... , to: ...}
// }

common.process_msg_set.push('event_subscribe');
console.info(common.process_msg_set);

var subMachine = function () {

  var is_sub = function(x) {
    return x && x.src_base && x.src_base.type === 'event'
           && x.in_msg && x.in_msg.Event && x.in_msg.Event[0] === 'subscribe';
  }

  var has_resp = function(x) {
    return x.resp;
  }

  var response2 = function(x) {
    try {
      var content = const_msg.prompt_message.subscribe;
      x.dst_base.type = 'text';
      x.dst_base.content = content;
      var res_content = msg_xml.create(x.dst_base);
      res_content = o2x(res_content);
      console.log('response message :' + res_content);
      x.resp.end(res_content);

      return x;
    } catch (e) {
      throw e;
    }
  }

  var text_pipe = function() {
      return _.pipeline(
        _.filter(is_sub),
        _.filter(has_resp),
        _.tap(function(x) {console.log('sub pipeline');}),
        _.map(response2),
        // compose_news,
        // msg_util.post_message_check(),
        _.errors(function(e){console.log('err: ' + e.message);})
      );
  }

  return {
    run : text_pipe
  };
}


var queue = new MemQueue(common.msg_queue_id);

queue.subscribe(function(err, data) {
  _([data])
  .pipe(subMachine().run())
  .errors(function(e) {
    console.log(e.message + '\n' + e.stack);
  })
  .done(function(x){});
})
