
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE' | "HEAD";
type DataType = Record<string, any>;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer"

type RestfulFetchFactoryBaseUrl = {
  baseUrl?: string;
  prefix?: string,
}

interface IRestfulFetchFactoryConfig {
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  reqInterceptor?: (config: RequestConfig) => Promise<RequestConfig>
  resInterceptor?: (response: Response, options?: RequestConfig) => Promise<any>
  errInterceptor?: (err: any) => void
}
type RequestConfig = { headers: HeaderType; fetchOptions: IFetchOption; responseType?: ResponseType, data?: DataType; url: string, method: Methods }

type RequestFactory = IRestfulFetchFactoryConfig & { url: string }
// 发起实例请求方法参数类型
type RequestOption = { headers?: HeaderType; fetchOptions?: IFetchOption; responseType?: ResponseType, data?: DataType }

/**
 * 删除字符串两边的'/'
 * @param str string
 * @returns string
 */
const removeSlash = (str: string) => {
  return str.trim().replace(/(^\/|\/$)/g, '')
}
/**
 *fetch原生请求 用于不做任何包装的fetch请求
 */
export const request = (url: string, options?: RequestInit): Promise<Response> => {
  return fetch(url, options)
}
// 请求类/
class Request {
  private readonly reqInterceptor: RequestFactory["reqInterceptor"]
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
    this.fetchOptions = fetchOptions;
    this.url = url
  }
  // 请求方法
  private async fetch(url: string, method: Methods, options: RequestOption): Promise<any> {
    method = method.toUpperCase() as Methods;
    const { data, headers, fetchOptions } = options;
    let body: any;
    // 合并请求头
    const assignHeader = Object.assign({}, this.headers, headers);
    // 合并fetch请求参数
    const _fetchOptions = Object.assign({}, this.fetchOptions, fetchOptions);
    const config = await this.reqInterceptor!({ url, headers: assignHeader, data, fetchOptions: _fetchOptions, responseType: options.responseType, method })
    const _headers = new Headers(config.headers);
    // 处理数据&&是否需要写contentType请求头,如果有传入content type 则不做任何处理
    const contentType = _headers.get('Content-Type');
    if (method === "GET" || method === "HEAD") {
      if (!contentType) {
        _headers.append('Content-Type', 'application/x-www-form-urlencode')
      }
    } else {
      if (data) {
        if (FormData && data instanceof FormData) {
          body = data;
        } else {
          if (!contentType) {
            if (typeof data === 'object') {
              _headers.append("Content-type", 'application/json;charset=utf-8')
              try {
                body = JSON.stringify(data)
              } catch (error) {
                return Promise.reject(error)
              }
            }
          } else {
            if (typeof data === 'object') {
              try {
                body = JSON.stringify(data)
              } catch (error) {
                return Promise.reject(error)
              }
            }
          }
        }
      } else {
        if (!contentType) {
          _headers.append("Content-type", 'application/json;charset=utf-8')
        }
      }
    }
    // 发送请求
    try {
      const response = await request(config.url, {
        headers: _headers,
        method,
        body,
        ...config.fetchOptions,
      })
      // 有拦截器，执行拦截器
      if (this.resInterceptor) {
        return this.resInterceptor(response, config)
      } else {
        if (response.ok) {
          switch (config.responseType) {
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
    let body: RequestOption = dataAndOptions;
    if (data) {
      if (typeof data === "string" || typeof data === "number") {
        url += `/${removeSlash(data + '')}`;
        if (body.data) {
          if (method === "GET") {
            url += '?' + new URLSearchParams(body.data).toString();
            delete body.data;
          }
        }
      } else if (typeof data == "object") {
        if (method === "GET") {
          url += '?' + new URLSearchParams(data).toString()
        } else {
          body.data = data
        }
      }
    }
    return this.fetch(url, method, body);
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
  constructor(private readonly options: IRestfulFetchFactoryConfig & RestfulFetchFactoryBaseUrl = {}) {
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
