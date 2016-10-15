var msg = require('../msg-json');
var assert = require('assert')

describe('json format message test', function() {
	it('text message -- full field', function() {
		var input = { from : 'from', to : 'to', type : 'text', content : 'hello world' };
		var output = msg.create(input);

		var expected = {
			touser : 'to',
		  msgtype : 'text',
			text : {
				content : 'hello world'
			}
		};
    assert.deepEqual(output, expected);
	});

	it('text message -- less field', function() {
		var input = { from : 'from', to : 'to', type : 'text'};
		var output = msg.create(input);

		var expected = {
			touser : 'to',
		  msgtype : 'text',
			text : {
				content : null
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
			touser : 'to',
		  msgtype : 'image',
			image : {
				media_id : '1234'
			}
		};
    assert.deepEqual(output, expected);
	});

})
