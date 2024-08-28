
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
type DataType = RequestInit['body'] | Record<any, any> | number;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer" | undefined
type IRequestInit = RequestInit & { headers: Headers }
type ModernFetchFactoryBaseUrl = {
  baseUrl?: string;
  prefix?: string,
}

interface IFactoryOption {
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  reqInterceptor?: (requestInit: IRequestInit, url: string) => Promise<IRequestInit>
  resInterceptor?: (response: Response, responseType: ResponseType, retry: <T = any>() => Promise<T>) => Promise<any>
  errInterceptor?: (err: any) => void
  transform?: (data: any, method?: Methods, url?: string) => any
}

// 发起请求方法参数类型
type RequestOption = { headers?: HeaderType; fetchOptions?: IFetchOption; responseType?: ResponseType, data?: DataType }

/**
 * 删除字符串两边的'/'
 * @param {string} str
 * @returns string
 */
const removeSlash = (str: string) => {
  return str.trim().replace(/(^\/|\/$)/g, '')
}
const isObject = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Object]';
}
/**
 *fetch原生请求 用于不做任何包装的fetch请求
 */
export const request = (url: string, options?: RequestInit): Promise<Response> => {
  return fetch(url, options)
}
// 请求类/
class Request {
  private reqInterceptor: IFactoryOption["reqInterceptor"]
  private resInterceptor: IFactoryOption["resInterceptor"]
  private errInterceptor: IFactoryOption["errInterceptor"]
  private readonly transform: IFactoryOption["transform"]
  private readonly headers: IFactoryOption["headers"]
  private readonly fetchOptions: IFactoryOption["fetchOptions"]
  private readonly url!: string

  constructor(options: IFactoryOption & { url: string }) {
    const { headers, resInterceptor, errInterceptor, reqInterceptor, transform, fetchOptions, url } = options;
    this.resInterceptor = resInterceptor;
    this.errInterceptor = errInterceptor;
    this.reqInterceptor = reqInterceptor
    this.transform = transform;
    this.headers = headers;
    this.fetchOptions = fetchOptions || {};
    this.url = url
  }


  // 发送请求
  private async fetch(url: string, requestInit: IRequestInit, responseType?: ResponseType): Promise<any> {
    const reqInit =this.reqInterceptor? await this.reqInterceptor(requestInit, url):requestInit
    // 发送请求
    try {
      const response = await fetch(url, reqInit);
      // 有拦截器，执行拦截器
      if (this.resInterceptor) {
        return this.resInterceptor(response, responseType, this.fetch.bind(this, url, requestInit, responseType))
      } else {
        if (response.ok) {
          switch (responseType) {
            case "json":
              return await response.json()
            case "text":
              return await response.text()
            case "blob":
              return await response.blob()
            case "formData":
              return await response.formData()
            case "arrayBuffer":
              return await response.arrayBuffer()
            default:
              return response
          }
        } else {
          return Promise.reject(response)
        }
      }
    } catch (err) {
      if (this.errInterceptor) {
        this.errInterceptor(err as TypeError)
      }
      return Promise.reject(err)
    }
  }
  // 处理RequestInit参数
  private async getRequestInit(url: string, method: Methods, data?: DataType, dataAndOptions: RequestOption = {}): Promise<[IRequestInit, string]> {
    const { data: body, headers: _headers, fetchOptions } = dataAndOptions;
    const defaultHeaders: Record<string, string> = {
    }
    const reqInit: RequestInit = {
      method,
      ...Object.assign({}, this.fetchOptions, fetchOptions),
    };

    const bodyHandler = (_paramData?: DataType) => {
      if (_paramData) {
        const paramData = this.transform ? this.transform(_paramData, method, url) : _paramData
        if (isObject(paramData)) {
          if (method === "GET") {
            url = `${url}?${new URLSearchParams(paramData as any).toString()}`;
          } else {
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
            reqInit.body = JSON.stringify(paramData)
          }
        } else {
          const paramDataIsString = typeof paramData === "string";
          if (paramDataIsString) {
            defaultHeaders['Content-Type'] = 'text/plain;charset=utf-8'
            reqInit.body = paramData as string
          } else if (Array.isArray(paramData)) {
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
            reqInit.body = JSON.stringify(paramData)
          } else {
            reqInit.body = paramData as RequestInit['body']
          }
        }
      }
    }

    if (data) {
      const dataIsString = typeof data === "string" || typeof data === "number";
      if (dataIsString) {
        url += `/${removeSlash(data.toString())}`; //拼接url
        bodyHandler(body)
      } else {
        bodyHandler(data)
      }
    } else {
      bodyHandler(body)
    }
    reqInit.headers = new Headers(Object.assign({}, this.headers, defaultHeaders, _headers));
    return [reqInit as IRequestInit, url]
  }
  // 自定义url请求方法
  async request<T>(url: string, requestInit: RequestInit, responseType?: ResponseType): Promise<T> {
    return await this.fetch(url, requestInit as IRequestInit, responseType)
  }
  // 发送请求
  private async send(method: Methods, data?: DataType, dataAndOptions: RequestOption = {}) {
    const [requestInit, url] = await this.getRequestInit(this.url, method, data, dataAndOptions);
    const { responseType } = dataAndOptions
    return this.fetch(url, requestInit, responseType)
  }
  /**
   * post请求
   * @param {DataType} data - 请求体或者请求url
   * @param {RequestOption} dataAndOptions - 请求参数
   * @returns
   */
  post<R>(data?: DataType, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("POST", data, dataAndOptions);
  }
  /**
   * 删除
   * @param {DataType} data - 需要删除记录的id
   * @param {RequestOption} dataAndOptions - 请求参数
   * @returns
   */
  delete<R>(data?: DataType, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("DELETE", data, dataAndOptions);
  }
  /**
   * 更新update 方法
   * @param {DataType} data - 需要更新记录的或者请求url
   * @param {RequestOption} dataAndOptions - 请求参数
   * @returns
   */
  put<R>(data?: DataType, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("PUT", data, dataAndOptions);
  }
  /**
  /**
   * patch
   * @param {DataType} data - 需要更新记录的或者请求url
   * @param {RequestOption} dataAndOptions - 请求参数
   * @returns
   */
  patch<R>(data?: DataType, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("PATCH", data, dataAndOptions);
  }
  /**
   * 条件查询
   * @param {DataType} data 查询的条件参数
   * @param {RequestOption} dataAndOptions - 请求参数
   * @returns
   */
  get<R>(data?: DataType, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("GET", data, dataAndOptions);
  }
}
/**
 * 构造ModernFetch实例，通常需要传入BaseUrl
 */
export class ModernFetch {
  constructor(private readonly options: IFactoryOption & ModernFetchFactoryBaseUrl = {}) {
  }
/**
 *添加request拦截
 * @param interceptor 请求拦截处理函数
 */
 addReqInterceptor(interceptor: IFactoryOption["reqInterceptor"]) {
  this.options.reqInterceptor = interceptor
 }

 /**
  * 添加response拦截
  * @param interceptor 响应拦截处理函数
  */
 addResInterceptor(interceptor: IFactoryOption["resInterceptor"]){
  this.options.resInterceptor = interceptor
 }

 /**
  * 添加错误拦截
  * @param interceptor 错误拦截处理
  */
 addErrInterceptor(interceptor: IFactoryOption["errInterceptor"]){
  this.options.errInterceptor = interceptor
 }
  /**
  * 添加请求参数处理 运行在 reqInterceptor 前面
  * @param interceptor 请求参数处理
  */
  addTransform(transform: IFactoryOption["transform"]){
    this.options.transform = transform
   }
  /**
   * 创建基于ModernFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
   * @param url 请求url
   * @returns Request 实例
   */
  create(url = '') {
    const { baseUrl, prefix, ...props } = this.options;
    if (prefix) {
      if (baseUrl) {
        url = `${removeSlash(baseUrl)}/${removeSlash(prefix)}${url}`;
      } else {
        url = `/${removeSlash(prefix)}${url}`;
      }
    } else {
      if (baseUrl) {
        url = `${removeSlash(baseUrl)}${url}`;
      }
    }

    return new Request({ url, ...props });
  }
}
