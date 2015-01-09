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

interface ServerSentEvent {
  data: string;
}

interface RecorderEvent<T> {
  type: string;
  data: T;
}

declare class EventSource<T> {
  constructor(url : string);
  onmessage: (event : ServerSentEvent) => void;
}

class RecorderClient {
  public jQuery : JQueryStatic;
  private es : EventSource<RecorderEvent<any>>;
  private recordListeners : Array<(req : RecordedRequest) => void>;
  constructor(private baseUrl : string) {
    this.jQuery = window['jQuery'];
    this.recordListeners = [];
    this.configureES();
  }

  onRecord(cb : (req  : RecordedRequest) => void) : () => void {
    this.recordListeners.push(cb);
    return () => {
      var i = this.recordListeners.indexOf(cb);
      this.recordListeners.splice(i, 1);
    }
  }

  clearRecordListeners() : void {
    this.recordListeners = [];
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
      var evt : RecorderEvent<any> = JSON.parse(e.data);
      switch (evt.type) {
      case 'recorded':
        this.recordListeners.forEach((cb) => cb(evt.data));
        break;
      }
    }
  }
}
