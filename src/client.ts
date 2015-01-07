/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/urijs/URI.d.ts"/>
interface RawRecordedRequest {
  url: string;
  method: string;
  requestHeaders: Object;
  requestBody: string;
}

interface RecordedRequest {
  path: string;
  queryParams: Object;
  method: string;
  requestHeaders: Object;
  requestBody: string;
}

export class RecorderClient {
  private jQuery : JQueryStatic;
  constructor(private baseUrl : string) {
    this.jQuery = window['jQuery'];
  }

  reset() : JQueryPromise<Object> {
    var p1 = this.makeRequest('DELETE', '/requests');
    var p2 = this.makeRequest('DELETE', '/stubs');
    return this.jQuery.when(p1, p2);
  }

  getRequests() : JQueryPromise<RecordedRequest[]> {
    var d = this.jQuery.Deferred();
    this.makeRequest<RawRecordedRequest[]>('GET', '/requests').then((raws) => {
      var rrs = raws.map((raw) => {
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
  }

  stubResponse(method : string, path : string, body : string) : JQueryPromise<Object> {
    return this.makeRequest('POST', '/stubs', {
      method: method,
      path: path,
      body: body
    })
  }

  private makeRequest<T>(method : string, path: string, data : Object = null) : JQueryPromise<T> {
    return this.jQuery.ajax({
      type: method,
      url: this.baseUrl + path,
      data: data && JSON.stringify(data)
    });
  }
}
