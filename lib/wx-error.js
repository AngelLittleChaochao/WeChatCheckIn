/**
 * @author Chaochao
 */

 var msg_json = require('./msg-json')
 var error_map = require('./const-msg').error_map;
 var logger = require('./log');
 var common = require('./common');
 var const_info = require('./const');
 var const_url = const_info.url;

 module.exports = {

   /**
   * get error id by wechat returned message
   * @param  {Object} res_message wechat response message, it's like {errcode:123, ...}
   * @return {[type]}             [description]
   */
   get_error_id : function(res_message) {
     try {
       var obj = JSON.parse(res_message);
       var msg = null;
       switch (obj.errcode) {
         case 45009 :
         msg = error_map.quota_usage_up.error;
         break;
         case 42001 :
         msg = error_map.get_token_failed.error;
         break;
         case 40006 :
         msg = error_map.image_size_big.error;
         break;
         default:
         break;
       }
       return msg;
     } catch (e) {
       return null;
     }
   }

 };
