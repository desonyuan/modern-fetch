
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
  resInterceptor?: (response: Response, options?: Omit<RequestOption, "data">&{url?:string}) => Promise<any>
  errInterceptor?: (err: TypeError) => void
}

type RequestFactory = Omit<IDesonFetchFactory, "baseUrl" | "prefix"> & { url: string }
// 发起实例请求方法参数类型
type RequestOption = Omit<IDesonFetchFactory, "resInterceptor" | "errInterceptor"|"baseUrl" | "prefix"> & { responseType?: ResponseType,data?:DataType }

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
  // 请求方法
  private async fetch(url: string, method: Methods, options: RequestOption): Promise<any> {
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
        }else{
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
        if(response.ok){
          switch (responseType) {
            case undefined:
            case "json":
              return await response.json()
            case "text":
              return await response.text()
            case "stream":
              return response
          }
        }else{
          return Promise.reject(response)
        }
      }
    } catch (err) {
      if (this.errInterceptor) {
        return this.errInterceptor(err as TypeError)
      }else{
       return Promise.reject(err)
      }
    }

  }
  // 发送请求
  private send(method: Methods,data?: DataType|string, dataAndOptions: RequestOption={}){
    let url=this.url;
    let body:RequestOption=dataAndOptions;
    if(data){
      if(typeof data==="string"){
        url+=removeSlash(data);
      }else if(typeof data=="object" ){
        if(method==="GET"){
          url += '?' + new URLSearchParams(data)
        }else{
          body={data}
        }
      }
    }
    return this.fetch(url, method, body);
  }
  /**
   * post请求
   * @param data 请求体或者请求url
   * @returns
   */
  post<R>(data?: DataType|string, dataAndOptions: RequestOption={}): Promise<R> {
    return this.send("POST",data,dataAndOptions);
  }
  /**
   * 删除
   * @param id 需要删除记录的id
   * @returns
   */
  delete<R>(data?: DataType|string, dataAndOptions: RequestOption={}): Promise<R> {
    return this.send("DELETE",data,dataAndOptions);
  }
  /**
   * 更新update 方法
   * @param data 需要更新记录的或者请求url
   * @param dataAndOptions 请求fetch参数
   * @returns
   */
  put<R>(data?: DataType|string, dataAndOptions: RequestOption={}): Promise<R> {
    return this.send("PUT",data,dataAndOptions);
  }
  /**
  /**
   * 更新patch 方法
   * @param data 需要更新记录的或者请求url
   * @param dataAndOptions 请求fetch参数
   * @returns
   */
  patch<R>(data?: DataType|string, dataAndOptions: RequestOption={}): Promise<R> {
    return this.send("PATCH",data,dataAndOptions);
  }
  /**
   * 条件查询
   * @param params 查询的条件参数
   * @returns
   */
  get<R>(data?: DataType|string, dataAndOptions: RequestOption={}): Promise<R> {
    return this.send("GET",data,dataAndOptions);
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
  create(url='') {
    const { baseUrl, prefix, ...props } = this.options;
    const _url=`/${removeSlash(url)}`;
    let str = '';
    if (prefix) {
      if (baseUrl) {
        str = `${removeSlash(baseUrl)}/${removeSlash(prefix)}${_url}`
      } else {
        str = `/${removeSlash(prefix)}${_url}`;
      }
    } else {
      if (baseUrl) {
        str = `${removeSlash(baseUrl)}${_url}`
      } else {
        str = _url;
      }
    }
    return new Request({ url: str, ...props })
  }
}
