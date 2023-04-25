
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE' | "HEAD";
type DataType = Record<string, any>;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers">
type ResponseType = "json" | 'stream' | 'text'
interface IDesonFetchFactory {
  baseUrl?: string;
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  prefix?: string,
  resInterceptor?: (response: Response, options?: Omit<RequestOption, "data">) => Promise<any>
  errInterceptor?: (err: TypeError) => void
}

type RequestFactory = Omit<IDesonFetchFactory, "baseUrl" | "prefix"> & { url: string }
// 发起实例请求方法参数类型
type RequestOption = Omit<Partial<RequestFactory>, "resInterceptor" | "errInterceptor"> & { responseType?: ResponseType,url?:string }
//发起fetch请求函数参数类型
type IFetchParam = Omit<RequestOption, "url"> & { data?: DataType }
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
export const request = async (url: string, options?: RequestInit): Promise<Response> => {
  return await fetch(url, options)
}
// 请求类/
class Request {
  private readonly resInterceptor: RequestFactory["resInterceptor"]
  private readonly errInterceptor: RequestFactory["errInterceptor"]
  private readonly headers: RequestFactory["headers"]
  private readonly fetchOptions: RequestFactory["fetchOptions"]
  private readonly url: string

  constructor(options: RequestFactory) {
    const { headers, resInterceptor, errInterceptor, fetchOptions, url } = options;
    this.resInterceptor = resInterceptor;
    this.errInterceptor = errInterceptor;
    this.headers = headers;
    this.fetchOptions = fetchOptions;
    this.url = url ?? '';
  }
  // 发送请求
  private async fetch(url: string, method: Methods, options: IFetchParam): Promise<any> {
    method = method.toUpperCase() as Methods;

    const { data, headers, responseType, fetchOptions } = options;
    let body: any;
    // 合并请求头
    const assignHeader = Object.assign({}, this.headers, headers);
    const _headers = new Headers(assignHeader);
    // 合并fetch请求参数
    const _fetchOptions = Object.assign({}, this.fetchOptions, fetchOptions);
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
        }
        if (!contentType) {
          if (typeof data === 'object') {
            _headers.append("Content-type", 'application/json;charset=utf-8')
            try {
              body = JSON.stringify(data)
            } catch (error) {
              console.log(error, '------DesonFetch')
            }
          }
        } else {
          if (typeof data === 'object') {
            try {
              body = JSON.stringify(data)
            } catch (error) {
              console.log(error, '------DesonFetch')
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
      const response = await request(url, {
        headers: _headers,
        method,
        body,
        ..._fetchOptions,
      })
      // 有拦截器，执行拦截器
      if (this.resInterceptor) {
        return await this.resInterceptor(response, {
          headers: assignHeader, responseType, fetchOptions: _fetchOptions, url,
        })
      } else {
        switch (responseType) {
          case undefined:
          case "json":
            return await response.json()
          case "text":
            return await response.text()
          case "stream":
            return response
        }
      }
    } catch (err) {
      if (this.errInterceptor) {
        return this.errInterceptor(err as TypeError)
      }else{
        console.error(err);
      }
    }

  }
  /**
   * post请求
   * @param data 字段内容
   * @returns
   */
  post<R>(data?: DataType, reqOption: RequestOption = {}): Promise<R> {
    const { url: reqUrl, ...reqParam } = reqOption;
    const url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url
    return this.fetch(url, "POST", {
      data,
      ...reqParam
    });
  }
  /**
   * 删除
   * @param id 需要删除记录的id
   * @returns
   */
  delete<R>(id?: string | number, data?: DataType, reqOption: RequestOption = {}): Promise<R> {
    const { url: reqUrl, ...reqParam } = reqOption;
    const url = reqUrl ? this.url + reqUrl : this.url;
    return this.fetch(`${url}${id ? '/' + id : ''}`, 'DELETE', {
      data,
      ...reqParam
    });
  }
  /**
   * 更新update 方法
   * @param id 需要更新记录的id
   * @param data 更新的新的字段对象
   * @returns
   */
  put<R>(id?: string | number, data?: DataType, reqOption: RequestOption = {}): Promise<R> {
    const { url: reqUrl, ...reqParam } = reqOption;
    const url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
    return this.fetch(`${url}${id ? '/' + id : ''}`, "PUT", {
      data,
      ...reqParam
    });
  }
  /**
 * 更新patch 方法
 * @param id 需要更新记录的id
 * @param data 更新的新的字段对象
 * @returns
 */
  patch<R>(id?: string | number, data?: DataType, reqOption: RequestOption = {}): Promise<R> {
    const { url: reqUrl, ...reqParam } = reqOption;
    let url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
    return this.fetch(`${url}${id ? '/' + id : ''}`, "PATCH", {
      data,
      ...reqParam
    });
  }
  /**
   * 条件查询
   * @param params 查询的条件参数
   * @returns
   */
  get<R>(params?: DataType,reqOption: RequestOption={}): Promise<R> {
    const { url: reqUrl,  ...reqParam } = reqOption;
    let url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
    // 拼接get方法请求参数
    if (params) {
      url += '?' + new URLSearchParams(params)
    }
    return this.fetch(url, 'GET', reqParam);
  }
  /**
   * 查询一个
   * @param id 记录id
   * @returns
   */
  getOne<R>(id?: number | string,params?:DataType, reqOption: RequestOption = {}): Promise<R> {
    // 拼接get方法请求参数
    const { url: reqUrl, ...reqParam } = reqOption;
    let url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
    id?url += `/${id}`:undefined;
    // 拼接get方法请求参数
    if (params) {
      url += '?' + new URLSearchParams(params)
    }
    return this.fetch(url, 'GET', reqParam);
  }
}
/**
 * 构造DesonFetch实例，通常需要传入BaseUrl
 */
export class DesonFetch {
  constructor(private readonly options: IDesonFetchFactory = {}) {
  }
  /**
   * 创建基于DesonFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
   * @param url string request url
   * @returns Request
   */
  create(url: string) {
    const { baseUrl, prefix, ...props } = this.options;
    let str = ''
    if (prefix) {
      if (baseUrl) {
        str = `${removeSlash(baseUrl)}/${removeSlash(prefix)}/${removeSlash(url)}`
      } else {
        str = `/${removeSlash(prefix)}/${removeSlash(url)}`;
      }
    } else {
      if (baseUrl) {
        str = `${removeSlash(baseUrl)}/${removeSlash(url)}`
      } else {
        str = `/${removeSlash(url)}`;
      }
    }
    return new Request({ url: str, ...props })
  }
}