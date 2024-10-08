type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
type DataType = RequestInit['body'] | Record<any, any> | number;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">;
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer" | undefined;
type IRequestInit = RequestInit & {
    headers: Headers;
};
type ModernFetchFactoryBaseUrl = {
    baseUrl?: string;
    prefix?: string;
};
type ReqInterceptor = (requestInit: IRequestInit, url: string) => Promise<IRequestInit>;
type ResInterceptor = <T = any>(response: Response, responseType: ResponseType, retry: () => Promise<T>) => Promise<any>;
type ErrInterceptor = (err: any) => void;
type Transform = (data: any, method?: Methods, url?: string) => any;
interface IFactoryOption {
    headers?: HeaderType;
    fetchOptions?: IFetchOption;
    reqIntcp?: ReqInterceptor;
    resIntcp?: ResInterceptor;
    errIntcp?: ErrInterceptor;
    transform?: Transform;
}
type RequestOption = {
    headers?: HeaderType;
    fetchOptions?: IFetchOption;
    responseType?: ResponseType;
    data?: DataType;
};
export declare class Request {
    private reqIntcp?;
    private resIntcp?;
    private errIntcp?;
    private readonly transform?;
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
     *  添加全局请求拦截
     * @param interceptor 请求拦截处理函数
     */
    static addGlobalReqIntcp(interceptor: ReqInterceptor): void;
    /**
     *  添加全局响应拦截
     * @param interceptor  响应拦截处理函数
     */
    static addGlobalResIntcp(interceptor: ResInterceptor): void;
    /**
     *  添加全局错误拦截
     * @param interceptor  错误拦截处理函数
     */
    static addGlobalErrIntcp(interceptor: ErrInterceptor): void;
    /**
     *添加request拦截
     * @param interceptor 请求拦截处理函数
     */
    addReqIntcp(interceptor: ReqInterceptor): void;
    /**
     * 添加response拦截
     * @param interceptor 响应拦截处理函数
     */
    addResIntcp(interceptor: ResInterceptor): void;
    /**
     * 添加错误拦截
     * @param interceptor 错误拦截处理
     */
    addErrIntcp(interceptor: ErrInterceptor): void;
    /**
    * 添加请求参数处理 运行在 reqInterceptor 前面
    * @param interceptor 请求参数转换处理
    */
    addTransform(transform: Transform): void;
    /**
     * 创建基于ModernFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
     * @param url 请求url
     * @returns Request 实例
     */
    create(url?: string): Request;
}
export {};
