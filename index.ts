
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
type DataType = RequestInit['body'];
type HeaderType = RequestInit["headers"];
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer"

type RestfulFetchFactoryBaseUrl = {
  baseUrl?: string;
  prefix?: string,
}

interface IFactoryOption {
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  reqInterceptor?: (config: RequestInit) => Promise<RequestInit>
  resInterceptor?: (response: Response, options?: RequestInit) => Promise<any>
  errInterceptor?: (err: any) => void
}

type RequestFactory = IFactoryOption & { url: string }
// 发起实例请求方法参数类型
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
  private readonly reqInterceptor:RequestFactory["reqInterceptor"]
  private readonly resInterceptor: RequestFactory["resInterceptor"]
  private readonly errInterceptor: RequestFactory["errInterceptor"]
  private readonly headers: RequestFactory["headers"]
  private readonly fetchOptions: RequestFactory["fetchOptions"]
  private readonly url!: string

  constructor(options: RequestFactory) {
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
  // 请求方法
  private async request(url: string, init: RequestInit, responseType?: ResponseType): Promise<any> {
    // 发送请求
    try {
      const response = await fetch(url, init);
      const _init= await this.reqInterceptor?.(init)
      // 有拦截器，执行拦截器
      if (this.resInterceptor) {
        return this.resInterceptor(response, init)
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
  // 发送请求
  private send(method: Methods, data?: DataType | string | number, dataAndOptions: RequestOption = {}) {
    let url = this.url;
    const { data: body, headers: _headers, fetchOptions, responseType } = dataAndOptions;
    const headers = new Headers(Object.assign({}, this.headers, _headers));
    const init: RequestInit = {
      headers,
      method,
      ...Object.assign({}, this.fetchOptions, fetchOptions),
    };
    if (data) {
      if (typeof data === "string" || typeof data === "number") {
        url += `/${removeSlash(data + '')}`; //拼接url
        if (body) {
          if (isObject(body) || typeof body == "string") {
            if (method === "GET") {
              url = `${url}?${new URLSearchParams(body as any).toString()}`;
            } else {
              init.body = typeof body == "string" ? body : JSON.stringify(body)
            }
          } else {
            init.body = body;
          }
        }
      } else if (isObject(data) && typeof data == "string") {
        init.body = typeof data == "string" ? data : JSON.stringify(data)
      } else {
        init.body = data
      }
    }
    return this.request(url, init, responseType);
  }
  /**
   * post请求
   * @param {string|object} data - 请求体或者请求url
   * @param {object} dataAndOptions - 请求fetch参数
   * @returns
   */
  post<R>(data?: DataType | string | number, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("POST", data, dataAndOptions);
  }
  /**
   * 删除
   * @param {string|object} data - 需要删除记录的id
   * @param {object} dataAndOptions - 请求fetch参数
   * @returns
   */
  delete<R>(data?: DataType | string | number, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("DELETE", data, dataAndOptions);
  }
  /**
   * 更新update 方法
   * @param {string|object} data - 需要更新记录的或者请求url
   * @param {object} dataAndOptions - 请求fetch参数
   * @returns
   */
  put<R>(data?: DataType | string | number, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("PUT", data, dataAndOptions);
  }
  /**
  /**
   * 更新patch 方法
   * @param {string|object} data - 需要更新记录的或者请求url
   * @param {object} dataAndOptions - 请求fetch参数
   * @returns
   */
  patch<R>(data?: DataType | string | number, dataAndOptions: RequestOption = {}): Promise<R> {
    return this.send("PATCH", data, dataAndOptions);
  }
  /**
   * 条件查询
   * @param {string|object} data 查询的条件参数
   * @param {object} dataAndOptions - 请求fetch参数
   * @returns
   */
  get<R>(data?: DataType | string | number, dataAndOptions: RequestOption = {}): Promise<R> {
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
