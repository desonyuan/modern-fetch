type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE' | "HEAD";
type DataType = Record<string, any>;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">;
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer";
type RestfulFetchFactoryBaseUrl = {
    baseUrl?: string;
    prefix?: string;
};
interface IRestfulFetchFactoryConfig {
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
type RequestFactory = IRestfulFetchFactoryConfig & {
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
     * @param {string|object} data - 请求体或者请求url
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    post<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 删除
     * @param {string|object} data - 需要删除记录的id
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    delete<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 更新update 方法
     * @param {string|object} data - 需要更新记录的或者请求url
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    put<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
    /**
     * 更新patch 方法
     * @param {string|object} data - 需要更新记录的或者请求url
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    patch<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 条件查询
     * @param {string|object} data 查询的条件参数
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    get<R>(data?: DataType | string | number, dataAndOptions?: RequestOption): Promise<R>;
}
/**
 * 构造RestfulFetch实例，通常需要传入BaseUrl
 */
export declare class RestfulFetch {
    private readonly options;
    constructor(options?: IRestfulFetchFactoryConfig & RestfulFetchFactoryBaseUrl);
    /**
     * 创建基于RestfulFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
     * @param url 请求url
     * @returns Request 实例
     */
    create(url?: string): Request;
}
export {};
