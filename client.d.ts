/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/urijs/URI.d.ts" />
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
interface Stub {
    method: string;
    path: string;
    body: string;
    headers?: Object;
    status?: number;
}
declare class EventSource<T> {
    constructor(url: string);
    onmessage: (event: ServerSentEvent) => void;
}
declare class RecorderClient {
    private baseUrl;
    jQuery: JQueryStatic;
    private es;
    private recordListeners;
    constructor(baseUrl: string);
    onRecord(cb: (req: RecordedRequest) => void): () => void;
    clearRecordListeners(): void;
    reset(): JQueryPromise<Object>;
    getRequests(): JQueryPromise<RecordedRequest[]>;
    stubResponse(stub: Stub): JQueryPromise<Object>;
    private makeRequest<T>(method, path, data?);
    private configureES();
}
