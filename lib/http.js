/**
 * @http.js express middle ware for face mask
 * msg.js Message format
 * @author Chaochao
 */

var logger = require('./log');


/**
 * #### express_middleware
 *
 * @ http related logic middleware for express
 *
 * @param {Stream} rea
 * @param {Stream} res
 * @param {Function} next
 *
 */

function express_middleware(req, res, next) {
  logger.info("auth_middleware");
    if (req.method === 'GET') {
      logger.info(req.url);
        var result = auth_request(req.query);
        if (!result) {
          next();
        }
        else if (result === "OK") {
          var echostr = req.query.echostr;
          res.end(echostr);
        } else {
          next();
        }
    } else {
        next();
    }
}

// check
function auth_request(query) {
    try {
        var signature = query.signature;
        var timestamp = query.timestamp;
        var nonce = query.nonce;

        if (signature !== undefined && timestamp !== undefined && nonce !== undefined) {
            return "OK";
        }
    } catch (e) {

    }
    return;
}

module.exports = express_middleware;
