/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/urijs/URI.d.ts"/>
var RecorderClient = (function () {
    function RecorderClient(baseUrl) {
        this.baseUrl = baseUrl;
        this.jQuery = window['jQuery'];
        this.recordListeners = [];
        this.configureES();
    }
    RecorderClient.prototype.onRecord = function (cb) {
        var _this = this;
        this.recordListeners.push(cb);
        return function () {
            var i = _this.recordListeners.indexOf(cb);
            _this.recordListeners.splice(i, 1);
        };
    };
    RecorderClient.prototype.reset = function () {
        var p1 = this.makeRequest('DELETE', '/requests');
        var p2 = this.makeRequest('DELETE', '/stubs');
        return this.jQuery.when(p1, p2);
    };
    RecorderClient.prototype.getRequests = function () {
        var d = this.jQuery.Deferred();
        this.makeRequest('GET', '/requests').then(function (raws) {
            var rrs = raws.map(function (raw) {
                var u = new URI(raw.url);
                return {
                    path: u.path(),
                    queryParams: u.query(true),
                    method: raw.method,
                    requestHeaders: raw.requestHeaders,
                    requestBody: raw.requestBody
                };
            });
            d.resolve(rrs);
        });
        return d.promise();
    };
    RecorderClient.prototype.stubResponse = function (method, path, body) {
        return this.makeRequest('POST', '/stubs', {
            method: method,
            path: path,
            body: body
        });
    };
    RecorderClient.prototype.makeRequest = function (method, path, data) {
        if (data === void 0) { data = null; }
        return this.jQuery.ajax({
            type: method,
            url: this.baseUrl + path,
            data: data && JSON.stringify(data)
        });
    };
    RecorderClient.prototype.configureES = function () {
        var _this = this;
        this.es = new EventSource(this.baseUrl + "/notifications");
        this.es.onmessage = function (e) {
            switch (e.data) {
                case '"recorded"':
                    _this.recordListeners.forEach(function (cb) { return cb(); });
                    break;
            }
        };
    };
    return RecorderClient;
})();
exports.RecorderClient = RecorderClient;
