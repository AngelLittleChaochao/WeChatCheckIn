/**
 * @msg.js Message format
 * msg.js Message format
 * @author Chaochao
 */

 /**
  * ### JsonMsg
  *
  * @ JsonMsg class
  *
  * create xml format message to wechat
  * To create message like:
  * ```js
  *   {
  *       "touser":"OPENID",
  *       "msgtype":"text",
  *       "text":
  *       {
  *            "content":"Hello World"
  *       }
  *   }
  * ```
  */

function JsonMsg () {

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
          touser: input.to ? input.to : null,
          msgtype: input.type,
        };
      }

      function create_text_msg() {
        var obj = create_head_msg();
        obj['text'] = { content :  input.content };
        return obj;
      }

      function create_image_msg() {
        var obj = create_head_msg();
        obj['image'] = { media_id :  input.content };
        return obj;
      }

      function create_news_msg() {
        var obj = create_head_msg();
        obj['news'] = { articles :  input.content };
        return obj;
      }

      if (input) {
          if (input.type === 'text') {
            return create_text_msg();
          } else if (input.type === 'image') {
            return create_image_msg();
          } else if (input.type === 'news') {
            console.log('news.......');
            return create_news_msg();
          } else {
            return null;
          }
      } else {
        return null;
      }
    }

    function JsonMsgInterface() {}

    JsonMsgInterface.prototype.create = createMsg;

    return new JsonMsgInterface();
}

  module.exports = new JsonMsg();
