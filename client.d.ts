/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/urijs/URI.d.ts" />
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
export declare class RecorderClient {
    private baseUrl;
    private jQuery;
    private es;
    private recordListeners;
    constructor(baseUrl: string);
    onRecord(cb: () => void): () => void;
    reset(): JQueryPromise<Object>;
    getRequests(): JQueryPromise<RecordedRequest[]>;
    stubResponse(method: string, path: string, body: string): JQueryPromise<Object>;
    private makeRequest<T>(method, path, data?);
    private configureES();
}
