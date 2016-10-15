var _ = require('highland');
var o2x = require('object-to-xml');

var MemQueue = require('../MemQueue');
var msg_xml = require('../msg-xml');
var const_msg = require('../const-msg');
var common = require('../common');

// only close the connection when no others process the message
// {
// req : request data
// res : response
// rawdata : raw data
// in_msg : {}
// src_base : {from : .., to:..., type:...}
// dst_base : {from : ... , to: ...}
// }

var textMachine = function () {

  //message not process by others
  var msg_no = function(x) {
    var type1 = x.src_base.type;
    if (common.process_msg_set.indexOf(type1) < 0) {
      return true;
    } else if (type1 === 'event') {
      try {
        var type2 = type1 + '_' + x.in_msg.Event[0];
        return common.process_msg_set.contains(type2) < 0;
      } catch (e) {
        // the message type is not complete
        return true;
      }
    }
  }

  var is_correct_format = function(x) {
    return x && x.src_base && x.in_msg;
  }

  var has_resp = function(x) {
    return x.resp;
  }

  var response2 = function(x) {
    try {
      x.resp.end();
      return x;
    } catch (e) {
      x.resp.end();
      throw e;
    }
  }

  var text_pipe = function() {
      return _.pipeline(
        _.filter(is_correct_format),
        _.filter(msg_no),
        _.filter(has_resp),
        _.tap(function(x) {console.log('last process pipeline');}),
        _.map(response2),
        _.errors(function(e){console.log('err: ' + e.message + e.stack);})
      );
  }

  return {
    run : text_pipe
  };
}


var queue = new MemQueue(common.msg_queue_id);

queue.subscribe(function(err, data) {
  _([data])
  .pipe(new textMachine().run())
  .errors(function(e) {
    console.log(e.message + '\n' + e.stack);
  })
  .done(function(x){});
  // process the data
})
