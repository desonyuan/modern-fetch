"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesonFetch = exports.request = void 0;
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
const request = async (url, options) => {
    return await fetch(url, options);
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
        this.url = url !== null && url !== void 0 ? url : '';
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
                                console.log(error, '------DesonFetch');
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
                                console.log(error, '------DesonFetch');
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
                try {
                    return await this.resInterceptor(response, config);
                }
                catch (error) {
                    return error;
                }
            }
            else {
                if (response.ok) {
                    switch (config.responseType) {
                        case undefined:
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
                    }
                }
                else {
                    return Promise.reject(response);
                }
            }
        }
        catch (err) {
            if (this.errInterceptor) {
                return this.errInterceptor(err);
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
                    url += '?' + new URLSearchParams(body.data);
                }
            }
            else if (typeof data == "object") {
                if (method === "GET") {
                    url += '?' + new URLSearchParams(data);
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
     * @param data 请求体或者请求url
     * @returns
     */
    post(data, dataAndOptions = {}) {
        return this.send("POST", data, dataAndOptions);
    }
    /**
     * 删除
     * @param id 需要删除记录的id
     * @returns
     */
    delete(data, dataAndOptions = {}) {
        return this.send("DELETE", data, dataAndOptions);
    }
    /**
     * 更新update 方法
     * @param data 需要更新记录的或者请求url
     * @param dataAndOptions 请求fetch参数
     * @returns
     */
    put(data, dataAndOptions = {}) {
        return this.send("PUT", data, dataAndOptions);
    }
    /**
    /**
     * 更新patch 方法
     * @param data 需要更新记录的或者请求url
     * @param dataAndOptions 请求fetch参数
     * @returns
     */
    patch(data, dataAndOptions = {}) {
        return this.send("PATCH", data, dataAndOptions);
    }
    /**
     * 条件查询
     * @param params 查询的条件参数
     * @returns
     */
    get(data, dataAndOptions = {}) {
        return this.send("GET", data, dataAndOptions);
    }
}
/**
 * 构造DesonFetch实例，通常需要传入BaseUrl
 */
class DesonFetch {
    constructor(options = {}) {
        this.options = options;
    }
    /**
     * 创建基于DesonFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
     * @param url string request url
     * @returns Request
     */
    create(url = '') {
        const { baseUrl, prefix, ...props } = this.options;
        let _url = url === '' ? url : `/${removeSlash(url)}`;
        let str = '';
        if (prefix) {
            if (baseUrl) {
                str = `${removeSlash(baseUrl)}/${removeSlash(prefix)}${_url}`;
            }
            else {
                str = `/${removeSlash(prefix)}${_url}`;
            }
        }
        else {
            if (baseUrl) {
                str = `${removeSlash(baseUrl)}${_url}`;
            }
            else {
                str = _url;
            }
        }
        return new Request({ url: str, ...props });
    }
}
exports.DesonFetch = DesonFetch;
