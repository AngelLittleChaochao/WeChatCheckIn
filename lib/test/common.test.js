var common = require('../common');
var assert = require('assert')

describe('add query string test', function() {
	it('http test -- without query str', function() {
    var url = 'http://abc.com/'
    var new_url = common.add_query_str(url, {user:'lily', pass:'hello'});
    assert('http://abc.com/?user=lily&pass=hello' === new_url);
	});

	it('http test -- with query str', function() {
    var url = 'http://abc.com/?test=true'
    var new_url = common.add_query_str(url, {user:'lily', pass:'hello'});
    assert('http://abc.com/?test=true&user=lily&pass=hello' === new_url);
	});

	it('http test -- with sub-directory', function() {
    var url = 'http://abc.com/abc'
    var new_url = common.add_query_str(url, {user:'lily', pass:'hello'});
    assert('http://abc.com/abc?user=lily&pass=hello' === new_url);
	});

  it('http test -- with empty option', function() {
    var url = 'http://abc.com/abc'
    var new_url = common.add_query_str(url, {});
    assert(url === new_url);
	});

  it('http test -- with null option', function() {
    var url = 'http://abc.com/abc'
    var new_url = common.add_query_str(url, null);
    assert('http://abc.com/abc' === new_url);
	});

  it('http test -- with base_url null', function() {
    var new_url = common.add_query_str(null, {user:'lily', pass:'hello'});
    assert('?user=lily&pass=hello' === new_url);
	});

  it('http test -- with both null', function() {
    var new_url = common.add_query_str(null, null);
    assert('' === new_url);
	});

	it('https test -- with sub-directory', function() {
    var url = 'https://abc.com/abc'
    var new_url = common.add_query_str(url, {user:'lily', pass:'hello'});
    assert('https://abc.com/abc?user=lily&pass=hello' === new_url);
	});
});
