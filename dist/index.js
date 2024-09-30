"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModernFetch = void 0;
let glbReqIntcp;
let glbResIntcp;
let glbErrIntcp;
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
// 请求类/
class Request {
    constructor(options) {
        const { headers, resIntcp, errIntcp, reqIntcp, transform, fetchOptions, url } = options;
        if (reqIntcp) {
            this.reqIntcp = reqIntcp;
        }
        if (resIntcp) {
            this.resIntcp = resIntcp;
        }
        if (errIntcp) {
            this.errIntcp = errIntcp;
        }
        if (transform) {
            this.transform = transform;
        }
        this.headers = headers;
        this.fetchOptions = fetchOptions || {};
        this.url = url;
    }
    // 发送请求
    fetch(url, requestInit, responseType) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqInit = this.reqIntcp ? yield this.reqIntcp(requestInit, url) : glbReqIntcp ? yield glbReqIntcp(requestInit, url) : requestInit;
            // 发送请求
            try {
                const response = yield fetch(url, reqInit);
                // 有拦截器，执行拦截器
                if (this.resIntcp) {
                    return this.resIntcp(response, responseType, this.fetch.bind(this, url, requestInit, responseType));
                }
                else if (glbResIntcp) {
                    return glbResIntcp(response, responseType, this.fetch.bind(this, url, requestInit, responseType));
                }
                else {
                    if (response.ok) {
                        switch (responseType) {
                            case "json":
                                return yield response.json();
                            case "text":
                                return yield response.text();
                            case "blob":
                                return yield response.blob();
                            case "formData":
                                return yield response.formData();
                            case "arrayBuffer":
                                return yield response.arrayBuffer();
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
                if (this.errIntcp) {
                    this.errIntcp(err);
                }
                else if (glbErrIntcp) {
                    glbErrIntcp(err);
                }
                return Promise.reject(err);
            }
        });
    }
    // 处理RequestInit参数
    getRequestInit(url, method, data, dataAndOptions = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: body, headers: _headers, fetchOptions } = dataAndOptions;
            const defaultHeaders = {};
            const reqInit = Object.assign({ method }, Object.assign({}, this.fetchOptions, fetchOptions));
            const bodyHandler = (_paramData) => {
                if (_paramData) {
                    const paramData = this.transform ? this.transform(_paramData, method, url) : _paramData;
                    const isGet = method === "GET";
                    if (isObject(paramData)) {
                        if (isGet) {
                            if (Object.keys(paramData).length > 0) {
                                url = `${url}?${new URLSearchParams(paramData).toString()}`;
                            }
                        }
                        else {
                            defaultHeaders['Content-Type'] = 'application/json;charset=utf-8';
                            reqInit.body = JSON.stringify(paramData);
                        }
                    }
                    else {
                        if (!isGet) {
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
        });
    }
    // 自定义url请求方法
    request(url, requestInit, responseType) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.fetch(url, requestInit, responseType);
        });
    }
    // 发送请求
    send(method, data, dataAndOptions = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const [requestInit, url] = yield this.getRequestInit(this.url, method, data, dataAndOptions);
            const { responseType } = dataAndOptions;
            return this.fetch(url, requestInit, responseType);
        });
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
     *  添加全局请求拦截
     * @param interceptor 请求拦截处理函数
     */
    static addGlobalReqIntcp(interceptor) {
        glbReqIntcp = interceptor;
    }
    /**
     *  添加全局响应拦截
     * @param interceptor  响应拦截处理函数
     */
    static addGlobalResIntcp(interceptor) {
        glbResIntcp = interceptor;
    }
    /**
     *  添加全局错误拦截
     * @param interceptor  错误拦截处理函数
     */
    static addGlobalErrIntcp(interceptor) {
        glbErrIntcp = interceptor;
    }
    /**
     *添加request拦截
     * @param interceptor 请求拦截处理函数
     */
    addReqIntcp(interceptor) {
        this.options.reqIntcp = interceptor;
    }
    /**
     * 添加response拦截
     * @param interceptor 响应拦截处理函数
     */
    addResIntcp(interceptor) {
        this.options.resIntcp = interceptor;
    }
    /**
     * 添加错误拦截
     * @param interceptor 错误拦截处理
     */
    addErrIntcp(interceptor) {
        this.options.errIntcp = interceptor;
    }
    /**
    * 添加请求参数处理 运行在 reqInterceptor 前面
    * @param interceptor 请求参数转换处理
    */
    addTransform(transform) {
        this.options.transform = transform;
    }
    /**
     * 创建基于ModernFetch实例返回的请求包装对象，包含基于url封装的get、post等方法
     * @param url 请求url
     * @returns Request 实例
     */
    create(url = '') {
        const _a = this.options, { baseUrl, prefix } = _a, props = __rest(_a, ["baseUrl", "prefix"]);
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
        return new Request(Object.assign({ url }, props));
    }
}
exports.ModernFetch = ModernFetch;
