type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE' | "HEAD";
type DataType = Record<string, any>;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">;
type ResponseType = "json" | 'stream' | 'text';
interface IDesonFetchFactory {
    baseUrl?: string;
    prefix?: string;
    headers?: HeaderType;
    fetchOptions?: IFetchOption;
    reqInterceptor?: (config: RequestConfig) => Promise<RequestConfig>;
    resInterceptor?: (response: Response, options?: RequestConfig) => Promise<any>;
    errInterceptor?: (err: TypeError) => void;
}
type RequestConfig = {
    headers: HeaderType;
    fetchOptions: IFetchOption;
    responseType?: ResponseType;
    data?: DataType;
    url: string;
    method: Methods;
};
type RequestFactory = Omit<IDesonFetchFactory, "baseUrl" | "prefix"> & {
    url: string;
};
type RequestOption = {
    headers?: HeaderType;
    fetchOptions?: IFetchOption;
    responseType?: ResponseType;
    data?: DataType;
};
/**
 *fetch原生请求 用于不做任何包装的fetch请求
 */
export declare const request: (url: string, options?: RequestInit) => Promise<Response>;
declare class Request {
    private readonly reqInterceptor;
    private readonly resInterceptor;
    private readonly errInterceptor;
    private readonly headers;
    private readonly fetchOptions;
    private readonly url;
    constructor(options: RequestFactory);
    private fetch;
    private send;
    /**
     * post请求
     * @param data 请求体或者请求url
     * @returns
     */
    post<R>(data?: DataType | string, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 删除
     * @param id 需要删除记录的id
     * @returns
     */
    delete<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 更新update 方法
     * @param data 需要更新记录的或者请求url
     * @param dataAndOptions 请求fetch参数
     * @returns
     */
    put<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
    /**
     * 更新patch 方法
     * @param data 需要更新记录的或者请求url
     * @param dataAndOptions 请求fetch参数
     * @returns
     */
    patch<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 条件查询
     * @param params 查询的条件参数
     * @returns
     */
    get<R>(data?: DataType | string, dataAndOptions?: RequestOption): Promise<R>;
}
/**
 * 构造DesonFetch实例，通常需要传入BaseUrl
 */
export declare class DesonFetch {
    private readonly options;
    constructor(options?: IDesonFetchFactory);
    /**
     * 创建基于DesonFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
     * @param url string request url
     * @returns Request
     */
    create(url?: string): Request;
}
export {};
