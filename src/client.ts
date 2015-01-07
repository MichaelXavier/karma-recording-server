/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/urijs/URI.d.ts"/>
export interface RawRecordedRequest {
  url: string;
  method: string;
  requestHeaders: Object;
  requestBody: string;
}

export interface RecordedRequest {
  path: string;
  queryParams: Object;
  method: string;
  requestHeaders: Object;
  requestBody: string;
}

interface ServerSentEvent<T> {
  data: T;
}

declare class EventSource<T> {
  constructor(url : string);
  onmessage: (event : ServerSentEvent<T>) => void;
}

export class RecorderClient {
  private jQuery : JQueryStatic;
  private es : EventSource<string>;
  private recordListeners : Array<() => void>;
  constructor(private baseUrl : string) {
    this.jQuery = window['jQuery'];
    this.recordListeners = [];
    this.configureES();
  }

  onRecord(cb : () => void) : () => void {
    this.recordListeners.push(cb);
    return () => {
      var i = this.recordListeners.indexOf(cb);
      this.recordListeners.splice(i, 1);
    }
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

  private configureES() : void {
    this.es = new EventSource(this.baseUrl + "/notifications");
    this.es.onmessage = (e) => {
      switch (e.data) {
      case "recorded":
        this.recordListeners.forEach((cb) => cb());
        break;
      }
    }
  }
}
