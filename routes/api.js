var fs = require('fs');

var WebshotAPI = require('../api');

/*!
 * Generate an image
 */
exports.generate = function(req, res) {
    var url = req.param('url');
    if (!url) {
        res.send(400, 'Missing url');
    }

    var options = {
        'width': req.param('width'),
        'height': req.param('height'),
        'full': (req.param('full') === 'true')
    };

    WebshotAPI.generate(url, options, function(err, path) {
        if (err) {
            res.send(err.code, err.msg);
        } else {
            res.sendfile(path, function() {
                fs.unlink(path);
            });
        }
    });
};
