
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
type DataType = RequestInit['body'];
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer"
type IRequestInit = RequestInit & { headers: Headers }
type RestfulFetchFactoryBaseUrl = {
  baseUrl?: string;
  prefix?: string,
}

interface IFactoryOption {
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  reqInterceptor?: (requestInit: IRequestInit) => Promise<IRequestInit>
  resInterceptor?: (response: Response, responseType?: ResponseType, requestInit?: IRequestInit) => Promise<any>
  errInterceptor?: (err: any) => void
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
  private readonly reqInterceptor: IFactoryOption["reqInterceptor"]
  private readonly resInterceptor: IFactoryOption["resInterceptor"]
  private readonly errInterceptor: IFactoryOption["errInterceptor"]
  private readonly headers: IFactoryOption["headers"]
  private readonly fetchOptions: IFactoryOption["fetchOptions"]
  private readonly url!: string

  constructor(options: IFactoryOption & { url: string }) {
    const { headers, resInterceptor, errInterceptor, reqInterceptor, fetchOptions, url } = options;
    this.resInterceptor = resInterceptor;
    this.errInterceptor = errInterceptor;
    this.reqInterceptor = async (config) => {
      if (reqInterceptor) {
        return await reqInterceptor(config)
      } else {
        return config
      }
    }
    this.headers = headers;
    this.fetchOptions = fetchOptions || {};
    this.url = url
  }
  // 发送请求
  private async fetch(url: string, requestInit: IRequestInit, responseType?: ResponseType) {
    // 发送请求
    try {
      const response = await fetch(url, requestInit);
      // 有拦截器，执行拦截器
      if (this.resInterceptor) {
        return this.resInterceptor(response, responseType, requestInit)
      } else {
        if (response.ok) {
          switch (responseType) {
            case "text":
              return await response.text()
            case "blob":
              return await response.blob()
            case "formData":
              return await response.formData()
            case "arrayBuffer":
              return await response.arrayBuffer()
            default:
              return await response.json()
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
    let { data: body, headers: _headers, fetchOptions } = dataAndOptions;
    const defaultHeaders: Record<string, string> = {}
    const reqInit: RequestInit = {
      method,
      ...Object.assign({}, this.fetchOptions, fetchOptions),
    };
    const dataIsString = typeof data === "string";
    const bodyIsString = typeof body === "string";
    const bodyHandler=()=>{
      if (body) {
        if (isObject(body)) {
          if (method === "GET") {
            url = `${url}?${new URLSearchParams(body as any).toString()}`;
          } else {
            reqInit.body = JSON.stringify(body)
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
          }
        } else {
          if (bodyIsString) {
            defaultHeaders['Content-Type'] = 'text/plain;charset=utf-8'
          }else if(Array.isArray(body)){
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
            body = JSON.stringify(body)
          }
          reqInit.body = body;
        }
      }
    }
    if(data){
      if (dataIsString || typeof data === "number") {
        url += `/${removeSlash(data + '')}`; //拼接url
        bodyHandler()
      }else{
        if (isObject(data)) {
          defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
          reqInit.body = JSON.stringify(data)
        } else {
          if(Array.isArray(body)){
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
            reqInit.body = JSON.stringify(data)
          }else{
            reqInit.body = data
          }
        }
      }
    }else{
      bodyHandler()
    }
    reqInit.headers = new Headers(Object.assign({}, this.headers, defaultHeaders, _headers));
    const _reqInit = await this.reqInterceptor!(reqInit as IRequestInit)
    return [_reqInit, url]
  }
  // 自定义url请求方法
  async request<T>(url: string, requestInit: RequestInit, responseType?: ResponseType): Promise<T> {
    return await this.fetch(url, requestInit as IRequestInit, responseType)
  }
  // 发送请求
  private async send(method: Methods, data?: DataType, dataAndOptions: RequestOption = {}) {
    const [init, url] = await this.getRequestInit(this.url, method, data, dataAndOptions);
    const { responseType } = dataAndOptions
    return this.fetch(url, init, responseType)
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
 * 构造RestfulFetch实例，通常需要传入BaseUrl
 */
export class RestfulFetch {
  constructor(private readonly options: IFactoryOption & RestfulFetchFactoryBaseUrl = {}) {
  }

  /**
   * 创建基于RestfulFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
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
