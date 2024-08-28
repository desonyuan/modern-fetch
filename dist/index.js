"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModernFetch = exports.request = void 0;
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
        const { headers, resInterceptor, errInterceptor, reqInterceptor, transform, fetchOptions, url } = options;
        this.resInterceptor = resInterceptor;
        this.errInterceptor = errInterceptor;
        this.reqInterceptor = reqInterceptor;
        this.transform = transform;
        this.headers = headers;
        this.fetchOptions = fetchOptions || {};
        this.url = url;
    }
    // 发送请求
    async fetch(url, requestInit, responseType) {
        const reqInit = this.reqInterceptor ? await this.reqInterceptor(requestInit, url) : requestInit;
        // 发送请求
        try {
            const response = await fetch(url, reqInit);
            // 有拦截器，执行拦截器
            if (this.resInterceptor) {
                return this.resInterceptor(response, responseType, this.fetch.bind(this, url, requestInit, responseType));
            }
            else {
                if (response.ok) {
                    switch (responseType) {
                        case "json":
                            return await response.json();
                        case "text":
                            return await response.text();
                        case "blob":
                            return await response.blob();
                        case "formData":
                            return await response.formData();
                        case "arrayBuffer":
                            return await response.arrayBuffer();
                        default:
                            return response;
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
        const bodyHandler = (_paramData) => {
            if (_paramData) {
                const paramData = this.transform ? this.transform(_paramData, method, url) : _paramData;
                if (isObject(paramData)) {
                    if (method === "GET") {
                        url = `${url}?${new URLSearchParams(paramData).toString()}`;
                    }
                    else {
                        defaultHeaders['Content-Type'] = 'application/json;charset=utf-8';
                        reqInit.body = JSON.stringify(paramData);
                    }
                }
                else {
                    const paramDataIsString = typeof paramData === "string";
                    if (paramDataIsString) {
                        defaultHeaders['Content-Type'] = 'text/plain;charset=utf-8';
                        reqInit.body = paramData;
                    }
                    else if (Array.isArray(paramData)) {
                        defaultHeaders['Content-Type'] = 'application/json;charset=utf-8';
                        reqInit.body = JSON.stringify(paramData);
                    }
                    else {
                        reqInit.body = paramData;
                    }
                }
            }
        };
        if (data) {
            const dataIsString = typeof data === "string" || typeof data === "number";
            if (dataIsString) {
                url += `/${removeSlash(data.toString())}`; //拼接url
                bodyHandler(body);
            }
            else {
                bodyHandler(data);
            }
        }
        else {
            bodyHandler(body);
        }
        reqInit.headers = new Headers(Object.assign({}, this.headers, defaultHeaders, _headers));
        return [reqInit, url];
    }
    // 自定义url请求方法
    async request(url, requestInit, responseType) {
        return await this.fetch(url, requestInit, responseType);
    }
    // 发送请求
    async send(method, data, dataAndOptions = {}) {
        const [requestInit, url] = await this.getRequestInit(this.url, method, data, dataAndOptions);
        const { responseType } = dataAndOptions;
        return this.fetch(url, requestInit, responseType);
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
 * 构造ModernFetch实例，通常需要传入BaseUrl
 */
class ModernFetch {
    constructor(options = {}) {
        this.options = options;
    }
    /**
     *添加request拦截
     * @param interceptor 请求拦截处理函数
     */
    useReqInterceptor(interceptor) {
        this.options.reqInterceptor = interceptor;
    }
    /**
     * 添加response拦截
     * @param interceptor 响应拦截处理函数
     */
    useResInterceptor(interceptor) {
        this.options.resInterceptor = interceptor;
    }
    /**
     * 添加错误拦截
     * @param interceptor 错误拦截处理
     */
    useErrInterceptor(interceptor) {
        this.options.errInterceptor = interceptor;
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
exports.ModernFetch = ModernFetch;
