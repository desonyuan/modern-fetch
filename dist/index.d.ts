type DataType = RequestInit['body'] | Record<any, any> | number;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">;
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer";
type IRequestInit = RequestInit & {
    headers: Headers;
};
type ModernFetchFactoryBaseUrl = {
    baseUrl?: string;
    prefix?: string;
};
interface IFactoryOption {
    headers?: HeaderType;
    fetchOptions?: IFetchOption;
    reqInterceptor?: (requestInit: IRequestInit, url?: string) => Promise<IRequestInit>;
    resInterceptor?: (response: Response, responseType?: ResponseType, request?: <T = any>() => Promise<T>) => Promise<any>;
    errInterceptor?: (err: any) => void;
}
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
    constructor(options: IFactoryOption & {
        url: string;
    });
    private fetch;
    private getRequestInit;
    request<T>(url: string, requestInit: RequestInit, responseType?: ResponseType): Promise<T>;
    private send;
    /**
     * post请求
     * @param {DataType} data - 请求体或者请求url
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    post<R>(data?: DataType, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 删除
     * @param {DataType} data - 需要删除记录的id
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    delete<R>(data?: DataType, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 更新update 方法
     * @param {DataType} data - 需要更新记录的或者请求url
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    put<R>(data?: DataType, dataAndOptions?: RequestOption): Promise<R>;
    /**
    /**
     * patch
     * @param {DataType} data - 需要更新记录的或者请求url
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    patch<R>(data?: DataType, dataAndOptions?: RequestOption): Promise<R>;
    /**
     * 条件查询
     * @param {DataType} data 查询的条件参数
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    get<R>(data?: DataType, dataAndOptions?: RequestOption): Promise<R>;
}
/**
 * 构造ModernFetch实例，通常需要传入BaseUrl
 */
export declare class ModernFetch {
    private readonly options;
    constructor(options?: IFactoryOption & ModernFetchFactoryBaseUrl);
    /**
     * 创建基于ModernFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
     * @param url 请求url
     * @returns Request 实例
     */
    create(url?: string): Request;
}
export {};
