"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestfulFetch = exports.request = void 0;
/**
 * 删除字符串两边的'/'
 * @param str string
 * @returns string
 */
const removeSlash = (str) => {
    return str.trim().replace(/(^\/|\/$)/g, '');
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
        this.fetchOptions = fetchOptions;
        this.url = url;
    }
    // 请求方法
    async fetch(url, method, options) {
        method = method.toUpperCase();
        const { data, headers, fetchOptions } = options;
        let body;
        // 合并请求头
        const assignHeader = Object.assign({}, this.headers, headers);
        // 合并fetch请求参数
        const _fetchOptions = Object.assign({}, this.fetchOptions, fetchOptions);
        const config = await this.reqInterceptor({ url, headers: assignHeader, data, fetchOptions: _fetchOptions, responseType: options.responseType, method });
        const _headers = new Headers(config.headers);
        // 处理数据&&是否需要写contentType请求头,如果有传入content type 则不做任何处理
        const contentType = _headers.get('Content-Type');
        if (method === "GET" || method === "HEAD") {
            if (!contentType) {
                _headers.append('Content-Type', 'application/x-www-form-urlencode');
            }
        }
        else {
            if (data) {
                if (FormData && data instanceof FormData) {
                    body = data;
                }
                else {
                    if (!contentType) {
                        if (typeof data === 'object') {
                            _headers.append("Content-type", 'application/json;charset=utf-8');
                            try {
                                body = JSON.stringify(data);
                            }
                            catch (error) {
                                return Promise.reject(error);
                            }
                        }
                    }
                    else {
                        if (typeof data === 'object') {
                            try {
                                body = JSON.stringify(data);
                            }
                            catch (error) {
                                return Promise.reject(error);
                            }
                        }
                    }
                }
            }
            else {
                if (!contentType) {
                    _headers.append("Content-type", 'application/json;charset=utf-8');
                }
            }
        }
        // 发送请求
        try {
            const response = await (0, exports.request)(config.url, {
                headers: _headers,
                method,
                body,
                ...config.fetchOptions,
            });
            // 有拦截器，执行拦截器
            if (this.resInterceptor) {
                return this.resInterceptor(response, config);
            }
            else {
                if (response.ok) {
                    switch (config.responseType) {
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
    // 发送请求
    send(method, data, dataAndOptions = {}) {
        let url = this.url;
        let body = dataAndOptions;
        if (data) {
            if (typeof data === "string" || typeof data === "number") {
                url += `/${removeSlash(data + '')}`;
                if (body.data) {
                    if (method === "GET") {
                        url += '?' + new URLSearchParams(body.data).toString();
                        delete body.data;
                    }
                }
            }
            else if (typeof data == "object") {
                if (method === "GET") {
                    url += '?' + new URLSearchParams(data).toString();
                }
                else {
                    body.data = data;
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
