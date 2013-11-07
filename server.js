var flatiron = require('flatiron')
  , app = flatiron.app
  , webshot = require('webshot')
  , temp = require("temp")
  , fs = require("fs")
  , im = require('imagemagick');

app.use(flatiron.plugins.http);

function createTmpPng(){
  return temp.path({suffix: '.png'});
}

function writeFileToResponse(file, response, callback){
  response.writeHead(200, { 'Content-Type': 'image/png' });
  fs.readFile(file, function(err, data){
    response.end(data);
    callback();
  });
}

function cleanupTmp(file){
  fs.unlink(file, function(err){
    if(err) console.error(err);
  });
}

function screenGrab(url, options, callback){
  var original = createTmpPng();

  var window_height = 'window';
  if (options.full == 'true') {
    window_height = 'all';
  }
  var options = { shotSize: {
     width: 'window',
     height: window_height
  }};

  webshot(url, original, options, function(err){
    callback(original, function(){
      cleanupTmp(original);
    });
  });
}

function convert(original, options, callback){
  var conversion = buildConversion(options);

  if(conversion.length == 0){
    callback(original, function(){});
  } else {
    var converted = createTmpPng();
    var imageMagickArgs = [original].concat(conversion).concat(converted);

    im.convert(imageMagickArgs,
      function(err, stdout, stderr){
        callback(converted, function(){
          cleanupTmp(converted);
        });
      }
    );
  }
}

function buildConversion(options){
  var conversion = [];

  if(options.width || options.height){
    var dimensions = (options.width||"") + "x" + (options.height||"")
    conversion = conversion.concat("-resize", dimensions);
  }

  return conversion;
}

app.router.get('/', function(request, response) {

  var self = this;

  var url = self.req.query.url || "https://github.com/opsb/node-webshot-server";

  var options = {
    'full': self.req.query.full,
  }

  screenGrab(url, options, function(original, cleanupScreenGrab){
    convert(original, self.req.query, function(converted, cleanupConversion){
      writeFileToResponse(converted, self.res, function(){
        cleanupScreenGrab();
        cleanupConversion();
      });
    });
  });
});

var port = process.env.PORT || 5000;
app.start(port);