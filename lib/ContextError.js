/**
 * customize error, detailed error message can be found in innerError
 * @param {string} id id of the error, used to define which error
 */
 function ContextError(message, context) {
	 var tmp = Error.apply(this, [message]);

	 this.message = tmp.message;
	 this.context = context;

	 Object.defineProperty(this, 'stack', { // getter for more optimizy goodness
		 get: function() {
			 return tmp.stack
		 }
	 })

 return this;
}

// standard method to add prototype.
// if directly set WXError.prototype = Error.prototype, then when setting other properties to WXError.prototype, it will effect Error.prototype.
// so using middleInheritor to do translate.
var middleInheritor = function() {}
middleInheritor.prototype = Error.prototype;
ContextError.prototype = new middleInheritor();
ContextError.prototype.innerError = null; // set innerError

module.exports = ContextError;
