var msg = require('../msg-xml');
var assert = require('assert')

process.env.TEST = true;

describe('xml format message test', function() {
	it('text message -- full field', function() {
		var input = { from : 'from', to : 'to', type : 'text', content : 'hello world' };
		var output = msg.create(input);

		var expected = {
			xml : {
				ToUserName : 'to',
				FromUserName : 'from',
				CreateTime : 0,
				MsgType : 'text',
				Content : 'hello world'
			}
		};
    assert.deepEqual(output, expected);
	});

	it('text message -- less field', function() {
		var input = { from : 'from', to : 'to', type : 'text'};
		var output = msg.create(input);

		var expected = {
			xml : {
				ToUserName : 'to',
				FromUserName : 'from',
				CreateTime : 0,
				MsgType : 'text',
				Content : null
			}
		};
    assert.deepEqual(output, expected);
	});

	it('text message -- no type', function() {
		var input = { from : 'from', to : 'to'};
		var output = msg.create(input);

    assert(output === null);
	});

	it('image message -- full field', function() {
		var input = { from : 'from', to : 'to', type : 'image', content : '1234'};
		var output = msg.create(input);

		var expected = {
			xml : {
				ToUserName : 'to',
				FromUserName : 'from',
				CreateTime : 0,
				MsgType : 'image',
				Image :  {
						MediaId : '1234'
				}
			}
		};
    assert.deepEqual(output, expected);
	});

})
