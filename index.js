var morgan = require('morgan');
var ehttp = require('karma-express-http-server')['framework:express-http-server'][1];
var SSE = require('express-sse');

var createRecordingServer = function (args, config, logger, helper) {
  config.expressHttpServer = config.recordingServer;
  delete config.recordingServer;

  config.expressHttpServer.appVisitor = function(app, log) {
    var requests = [];
    var stubs = [];
    var sse = new SSE([{type: 'booted'}]);

    function parseRequest(req) {
      return {
        url: req.url,
        method: req.method,
        requestHeaders: req.headers,
        requestBody: req.body
      };
    }

    function findStub(req) {
      for (var i = 0; i < stubs.length; i++) {
        var stub = stubs[i];
        if (req.method == stub.method &&
            req.path.match(stub.path)) {
          return stub;
        }
      }
      return undefined;
    }

    if (config.expressHttpServer.logging) app.use(morgan('combined'));

    // slurp entire request body
    app.use(function(req, res, next) {
      var data = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk) {
        data += chunk;
      });

      req.on('end', function() {
        req.body = data;
        next();
      });
    });

    // kick rocks, CORS
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,POST,DELETE");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    // bookkeeping
    app.delete('/requests', function(req, res) {
      requests = [];
      res.end();
    });

    app.delete('/stubs', function(req, res) {
      stubs = [];
      res.end();
    });

    app.get('/requests', function(req, res) {
      res.set('Content-Type', 'application/json');
      res.json(requests);
    });

    app.post('/stubs', function(req, res) {
      var stub = JSON.parse(req.body);
      stub.path = new RegExp(stub.path);
      stubs.push(stub);
      res.end();
    });

    app.get('/notifications', sse.init);

    app.all('*', function(req, res) {
      if (req.method !== 'OPTIONS') {
        var parsed = parseRequest(req);
        requests.push(parsed);
        sse.send({type: 'recorded', data: parsed});
        var stub = findStub(req);
        if (stub) {
          if (stub.headers) {
            Object.keys(stub.headers).forEach(function(k) {
              res.set(k, stub.headers[k]);
            })
          }
          sse.send({type: 'stubbed'});
          res.send(stub.body);
        }
      }
      res.end();
    });
  }

  ehttp(args, config, logger, helper);
};


module.exports = {
  'framework:recording-server': ['factory', createRecordingServer],
};
