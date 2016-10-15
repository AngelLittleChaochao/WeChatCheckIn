var util = require('util');

module.exports = {
    token_key    : 'wx:token_key',
    leader_key   : 'wx:leader_key',
    users_key    : 'wx:users_key',
    channel_name : 'wx:pub/sub channel',

    url : {
        media_upload_url       : 'https://api.weixin.qq.com/cgi-bin/media/upload', //accesstoken is needed
        img_upload_url       : 'https://api.weixin.qq.com/cgi-bin/media/upload?type=image', //accesstoken is needed
        img_process_url      : 'https://imagebus.azurewebsites.net/upload', // process image url
        msg_upload_url       : 'https://api.weixin.qq.com/cgi-bin/message/custom/send', //accesstoken is needed
        img_del_url      : 'https://imagebus.azurewebsites.net/delete', // delete url

        get_media_list_url   : 'https://api.weixin.qq.com/cgi-bin/material/batchget_material',

        msg_upload_url_test  : '',
        log_upload_url       : 'http://facelogservice.azurewebsites.net/log'
    },

    msg_queue_id : 'wechat channel',
    process_msg_set : [],
    sample_medias : [],

    token_url_wx : function () {
        var appid = process.env.appid || '' ;
        var secret = process.env.secret || '';
        var base_url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential';

        return util.format("%s&appid=%s&secret=%s", base_url, appid, secret);
    },
    add_query_str : function (base_url, options) {
        base_url = base_url || '';

        if (options === null || options === undefined) {
            return base_url;
        }

        try {
            var count = Object.keys(options);
            if (count < 1) {
                return base_url;
            }
        } catch (e) {
            return base_url;
        }

        var mark_pos = base_url.indexOf('?');
        var add_char = '';
        if ( mark_pos=== -1) {
            add_char = '?';
        } else if (base_url.length - mark_pos > 2){ // http://a/?a=b
            add_char = '&';
        }

        var opt_arr = [];
        for (var key in options) {
            opt_arr.push(key + '=' + options[key])
        }
        var added_str = opt_arr.join('&');
        var result = util.format('%s%s%s', base_url, add_char, added_str);
        if (result.length <= 1) {
            return '';
        }
        return result;
    }
}
