
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

type ReqInterceptor= (requestInit: IRequestInit, url: string) => Promise<IRequestInit>
type ResInterceptor = <T = any>(response: Response, responseType: ResponseType, retry: () => Promise<T>) => Promise<any>
type ErrInterceptor = (err: any) => void
type Transform= (data: any, method?: Methods, url?: string) => any

let glbReqIntcp: ReqInterceptor | undefined
let glbResIntcp: ResInterceptor | undefined
let glbErrIntcp: ErrInterceptor | undefined

interface IFactoryOption {
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  reqIntcp?: ReqInterceptor
  resIntcp?: ResInterceptor
  errIntcp?:ErrInterceptor
  transform?: Transform
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

// 请求类/
class Request {
  private reqIntcp?: ReqInterceptor
  private resIntcp?: ResInterceptor
  private errIntcp?: ErrInterceptor
  private readonly transform?: Transform
  private readonly headers: IFactoryOption["headers"]
  private readonly fetchOptions: IFactoryOption["fetchOptions"]
  private readonly url!: string

  constructor(options: IFactoryOption & { url: string }) {
    const { headers, resIntcp, errIntcp, reqIntcp, transform, fetchOptions, url } = options;
    if(reqIntcp){
      this.reqIntcp = reqIntcp;
    }
    if(resIntcp){
      this.resIntcp = resIntcp;
    }
     if(errIntcp){
      this.errIntcp = errIntcp;
    }
    if(transform){
      this.transform = transform;
    }

    this.headers = headers;
    this.fetchOptions = fetchOptions || {};
    this.url = url
  }


  // 发送请求
  private async fetch(url: string, requestInit: IRequestInit, responseType?: ResponseType): Promise<any> {
    const reqInit = this.reqIntcp ? await this.reqIntcp(requestInit, url) :glbReqIntcp?await glbReqIntcp(requestInit, url): requestInit
    // 发送请求
    try {
      const response = await fetch(url, reqInit);
      // 有拦截器，执行拦截器
      if (this.resIntcp) {
        return this.resIntcp(response, responseType, this.fetch.bind(this, url, requestInit, responseType))
      }else if(glbResIntcp){
        return glbResIntcp(response, responseType, this.fetch.bind(this, url, requestInit, responseType))
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
      if (this.errIntcp) {
        this.errIntcp(err as TypeError)
      }else if(glbErrIntcp){
        glbErrIntcp(err as TypeError)
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
        const isGet = method === "GET";

        if (isObject(paramData)) {
          if (isGet) {
            if (Object.keys(paramData).length > 0) {
              url = `${url}?${new URLSearchParams(paramData as any).toString()}`;
            }
          } else {
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8'
            reqInit.body = JSON.stringify(paramData)
          }
        } else {
          if (!isGet) {
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
   *  添加全局请求拦截
   * @param interceptor 请求拦截处理函数
   */
  static addGlobalReqIntcp(interceptor: ReqInterceptor) {
    glbReqIntcp = interceptor
  }
  /**
   *  添加全局响应拦截
   * @param interceptor  响应拦截处理函数
   */
  static addGlobalResIntcp(interceptor: ResInterceptor) {
    glbResIntcp = interceptor
  }
  /**
   *  添加全局错误拦截
   * @param interceptor  错误拦截处理函数
   */
  static addGlobalErrIntcp(interceptor: ErrInterceptor) {
    glbErrIntcp = interceptor
  }
  /**
   *添加request拦截
   * @param interceptor 请求拦截处理函数
   */
  addReqIntcp(interceptor: ReqInterceptor) {
    this.options.reqIntcp = interceptor
  }

  /**
   * 添加response拦截
   * @param interceptor 响应拦截处理函数
   */
  addResIntcp(interceptor: ResInterceptor) {
    this.options.resIntcp = interceptor
  }

  /**
   * 添加错误拦截
   * @param interceptor 错误拦截处理
   */
  addErrIntcp(interceptor: ErrInterceptor) {
    this.options.errIntcp = interceptor
  }
  /**
  * 添加请求参数处理 运行在 reqInterceptor 前面
  * @param interceptor 请求参数转换处理
  */
  addTransform(transform: Transform) {
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
