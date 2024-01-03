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
                return this.resInterceptor(response, requestInit);
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
        const headers = new Headers(Object.assign({}, this.headers, _headers));
        const init = {
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
                            url = `${url}?${new URLSearchParams(body).toString()}`;
                        }
                        else {
                            init.body = typeof body == "string" ? body : JSON.stringify(body);
                        }
                    }
                    else {
                        init.body = body;
                    }
                }
            }
            else if (isObject(data) && typeof data == "string") {
                init.body = typeof data == "string" ? data : JSON.stringify(data);
            }
            else {
                init.body = data;
            }
        }
        const _init = await this.reqInterceptor(init);
        return [_init, url];
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
     * @param {string|object} data - 请求体或者请求url
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    post(data, dataAndOptions = {}) {
        return this.send("POST", data, dataAndOptions);
    }
    /**
     * 删除
     * @param {string|object} data - 需要删除记录的id
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    delete(data, dataAndOptions = {}) {
        return this.send("DELETE", data, dataAndOptions);
    }
    /**
     * 更新update 方法
     * @param {string|object} data - 需要更新记录的或者请求url
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    put(data, dataAndOptions = {}) {
        return this.send("PUT", data, dataAndOptions);
    }
    /**
    /**
     * 更新patch 方法
     * @param {string|object} data - 需要更新记录的或者请求url
     * @param {object} dataAndOptions - 请求fetch参数
     * @returns
     */
    patch(data, dataAndOptions = {}) {
        return this.send("PATCH", data, dataAndOptions);
    }
    /**
     * 条件查询
     * @param {string|object} data 查询的条件参数
     * @param {object} dataAndOptions - 请求fetch参数
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
