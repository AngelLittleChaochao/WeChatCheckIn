var _ = require('highland');
var o2x = require('object-to-xml');

var MemQueue = require('../MemQueue');
var msg_xml = require('../msg-xml');
var const_msg = require('../const-msg');
var common = require('../common');



// process text message
// {
// req : request data
// res : response
// rawdata : raw data
// in_msg : {}
// src_base : {from : .., to:..., type:...}
// dst_base : {from : ... , to: ...}
// }

common.process_msg_set.push('text');
console.info(common.process_msg_set);

var textMachine = function () {

  var is_text = function(x) {
    return x && x.src_base && x.src_base.type === 'text';
  }

  var has_resp = function(x) {
    return x.resp;
  }

  var response2 = function(x) {
    try {
      var content = const_msg.prompt_message.text;
      // get user input content
      var user_content = x.in_msg.Content && x.in_msg.Content[0];
      if (user_content.indexOf(const_msg.tags.feedback) >= 0) {
          content = const_msg.prompt_message.feedback_resp;
      }

      x.dst_base.type = 'text';
      x.dst_base.content = content;
      var res_content = msg_xml.create(x.dst_base);
      res_content = o2x(res_content);
      console.log('response message:' + res_content);
      x.resp.end(res_content);

      return x;
    } catch (e) {
      x.resp.end();
      throw e;
    }
  }

  var text_pipe = function() {
      return _.pipeline(
        _.filter(is_text),
        _.filter(has_resp),
        _.tap(function(x) {console.log('text pipeline');}),
        _.map(response2),
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
  .pipe(textMachine().run())
  .errors(function(e) {
    console.log(e.message + '\n' + e.stack);
  })
  .done(function(x){});
})
