"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestfulFetch = exports.request = void 0;
/**
 * 删除字符串两边的'/'
 * @param {string} str
 * @returns string
 */
const removeSlash = (str) => {
    return str.trim().replace(/(^\/|\/$)/g, '');
};
const isObject = (value) => {
    return Object.prototype.toString.call(value) === '[object Object]';
};
/**
 *fetch原生请求 用于不做任何包装的fetch请求
 */
const request = (url, options) => {
    return fetch(url, options);
};
exports.request = request;
// 请求类/
class Request {
    constructor(options) {
        const { headers, resInterceptor, errInterceptor, reqInterceptor, fetchOptions, url } = options;
        this.resInterceptor = resInterceptor;
        this.errInterceptor = errInterceptor;
        this.reqInterceptor = async (config) => {
            if (reqInterceptor) {
                return await reqInterceptor(config);
            }
            else {
                return config;
            }
        };
        this.headers = headers;
        this.fetchOptions = fetchOptions || {};
        this.url = url;
    }
    // 发送请求
    async fetch(url, requestInit, responseType) {
        // 发送请求
        try {
            const response = await fetch(url, requestInit);
            // 有拦截器，执行拦截器
            if (this.resInterceptor) {
                return this.resInterceptor(response, responseType, requestInit);
            }
            else {
                if (response.ok) {
                    switch (responseType) {
                        case "text":
                            return await response.text();
                        case "blob":
                            return await response.blob();
                        case "formData":
                            return await response.formData();
                        case "arrayBuffer":
                            return await response.arrayBuffer();
                        default:
                            return await response.json();
                    }
                }
                else {
                    return Promise.reject(response);
                }
            }
        }
        catch (err) {
            if (this.errInterceptor) {
                this.errInterceptor(err);
            }
            return Promise.reject(err);
        }
    }
    // 处理RequestInit参数
    async getRequestInit(url, method, data, dataAndOptions = {}) {
        const { data: body, headers: _headers, fetchOptions } = dataAndOptions;
        const defaultHeaders = {};
        const reqInit = {
            method,
            ...Object.assign({}, this.fetchOptions, fetchOptions),
        };
        const dataIsString = typeof data === "string";
        if (data === undefined || body && dataIsString) {
            const bodyIsString = typeof body === "string";
            if (isObject(body)) {
                if (method === "GET") {
                    url = `${url}?${new URLSearchParams(body).toString()}`;
                    defaultHeaders['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
                }
                else {
                    reqInit.body = JSON.stringify(body);
                    defaultHeaders['Content-Type'] = 'application/json;charset=utf-8';
                }
            }
            else {
                if (bodyIsString) {
                    defaultHeaders['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
                }
                reqInit.body = body;
            }
        }
        if (dataIsString || typeof data === "number") {
            url += `/${removeSlash(data + '')}`; //拼接url
        }
        else if (isObject(data)) {
            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8';
            reqInit.body = JSON.stringify(data);
        }
        else {
            reqInit.body = data;
            delete defaultHeaders['Content-Type'];
        }
        reqInit.headers = new Headers(Object.assign({}, this.headers, defaultHeaders, _headers));
        const _reqInit = await this.reqInterceptor(reqInit);
        return [_reqInit, url];
    }
    // 自定义url请求方法
    async request(url, requestInit, responseType) {
        return await this.fetch(url, requestInit, responseType);
    }
    // 发送请求
    async send(method, data, dataAndOptions = {}) {
        const [init, url] = await this.getRequestInit(this.url, method, data, dataAndOptions);
        const { responseType } = dataAndOptions;
        return this.fetch(url, init, responseType);
    }
    /**
     * post请求
     * @param {DataType} data - 请求体或者请求url
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    post(data, dataAndOptions = {}) {
        return this.send("POST", data, dataAndOptions);
    }
    /**
     * 删除
     * @param {DataType} data - 需要删除记录的id
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    delete(data, dataAndOptions = {}) {
        return this.send("DELETE", data, dataAndOptions);
    }
    /**
     * 更新update 方法
     * @param {DataType} data - 需要更新记录的或者请求url
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    put(data, dataAndOptions = {}) {
        return this.send("PUT", data, dataAndOptions);
    }
    /**
    /**
     * patch
     * @param {DataType} data - 需要更新记录的或者请求url
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    patch(data, dataAndOptions = {}) {
        return this.send("PATCH", data, dataAndOptions);
    }
    /**
     * 条件查询
     * @param {DataType} data 查询的条件参数
     * @param {RequestOption} dataAndOptions - 请求参数
     * @returns
     */
    get(data, dataAndOptions = {}) {
        return this.send("GET", data, dataAndOptions);
    }
}
/**
 * 构造RestfulFetch实例，通常需要传入BaseUrl
 */
class RestfulFetch {
    constructor(options = {}) {
        this.options = options;
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
            }
            else {
                url = `/${removeSlash(prefix)}${url}`;
            }
        }
        else {
            if (baseUrl) {
                url = `${removeSlash(baseUrl)}${url}`;
            }
        }
        return new Request({ url, ...props });
    }
}
exports.RestfulFetch = RestfulFetch;
