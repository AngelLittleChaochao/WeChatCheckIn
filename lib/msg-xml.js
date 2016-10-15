/**
 * msg.js Message format
 * @author Chaochao
 */

 /**
  * ### XmlMsg
  *
  * @ XmlMsg class
  *
  * create xml format message to wechat
  * To create message like:
  * ```js
  * xml : {
  *   ToUserName : 'to',
  *   FromUserName : 'from',
  *   CreateTime : '1444',
  *   MsgType : 'text',
  *   Content : 'hello world'
  * }
  * ```
  */

  function XmlMsg () {

    var time_stamp = function () {
      if (process.env.TEST) {
        // for test purpose, time make case never success
        return 0;
      } else {
        return Date.now();
      }
    };

    function createMsg(input) {
      function create_head_msg() {
        return {
          xml : {
            FromUserName : input.from ? input.from : null,
            ToUserName : input.to ? input.to : null,
            CreateTime: time_stamp(),
            MsgType : input.type,
          }
        };
      }

      function create_text_msg() {
        var obj = create_head_msg();
        obj.xml['Content'] = input.content;
        return obj;
      }

      function create_image_msg() {
        var obj = create_head_msg();
        obj.xml['Image'] = { MediaId : input.content};
        return obj;
      }

      if (input) {
          if (input.type === 'text') {
            return create_text_msg();
          } else if (input.type === 'image') {
            return create_image_msg();
          }
      }
      return null;
    }

    function XmlMsgInterface() {}

    XmlMsgInterface.prototype.create = createMsg;

    return new XmlMsgInterface();
  }

  module.exports = new XmlMsg();
