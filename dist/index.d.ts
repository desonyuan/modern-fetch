type DataType = Record<string, any>;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">;
type ResponseType = "json" | 'stream' | 'text';
interface IDesonFetchFactory {
    baseUrl?: string;
    headers?: HeaderType;
    fetchOptions?: IFetchOption;
    prefix?: string;
    resInterceptor?: (response: Response, options?: Omit<RequestOption, "data">) => Promise<any>;
    errInterceptor?: (err: TypeError) => void;
}
type RequestFactory = Omit<IDesonFetchFactory, "baseUrl" | "prefix"> & {
    url: string;
};
type RequestOption = Omit<Partial<RequestFactory>, "resInterceptor" | "errInterceptor"> & {
    responseType?: ResponseType;
    url?: string;
};
/**
 *fetch原生请求 用于不做任何包装的fetch请求
 */
export declare const request: (url: string, options?: RequestInit) => Promise<Response>;
declare class Request {
    private readonly resInterceptor;
    private readonly errInterceptor;
    private readonly headers;
    private readonly fetchOptions;
    private readonly url;
    constructor(options: RequestFactory);
    private fetch;
    /**
     * post请求
     * @param data 字段内容
     * @returns
     */
    post<R>(data?: DataType, reqOption?: RequestOption): Promise<R>;
    /**
     * 删除
     * @param id 需要删除记录的id
     * @returns
     */
    delete<R>(id?: string | number, data?: DataType, reqOption?: RequestOption): Promise<R>;
    /**
     * 更新update 方法
     * @param id 需要更新记录的id
     * @param data 更新的新的字段对象
     * @returns
     */
    put<R>(id?: string | number, data?: DataType, reqOption?: RequestOption): Promise<R>;
    /**
   * 更新patch 方法
   * @param id 需要更新记录的id
   * @param data 更新的新的字段对象
   * @returns
   */
    patch<R>(id?: string | number, data?: DataType, reqOption?: RequestOption): Promise<R>;
    /**
     * 条件查询
     * @param params 查询的条件参数
     * @returns
     */
    get<R>(params?: DataType, reqOption?: RequestOption): Promise<R>;
    /**
     * 查询一个
     * @param id 记录id
     * @returns
     */
    getOne<R>(id?: number | string, params?: DataType, reqOption?: RequestOption): Promise<R>;
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
    create(url: string): Request;
}
export {};
