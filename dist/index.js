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
const request = (url, options) => __awaiter(void 0, void 0, void 0, function* () {
    return yield fetch(url, options);
});
exports.request = request;
// 请求类/
class Request {
    constructor(options) {
        const { headers, resInterceptor, errInterceptor, fetchOptions, url } = options;
        this.resInterceptor = resInterceptor;
        this.errInterceptor = errInterceptor;
        this.headers = headers;
        this.fetchOptions = fetchOptions;
        this.url = url !== null && url !== void 0 ? url : '';
    }
    // 发送请求
    fetch(url, method, options) {
        return __awaiter(this, void 0, void 0, function* () {
            method = method.toUpperCase();
            const { data, headers, responseType, fetchOptions } = options;
            let body;
            // 合并请求头
            const assignHeader = Object.assign({}, this.headers, headers);
            const _headers = new Headers(assignHeader);
            // 合并fetch请求参数
            const _fetchOptions = Object.assign({}, this.fetchOptions, fetchOptions);
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
                    if (!contentType) {
                        if (typeof data === 'object') {
                            _headers.append("Content-type", 'application/json;charset=utf-8');
                            try {
                                body = JSON.stringify(data);
                            }
                            catch (error) {
                                console.log(error, '------DesonFetch');
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
                const response = yield (0, exports.request)(url, Object.assign({ headers: _headers, method,
                    body }, _fetchOptions));
                // 有拦截器，执行拦截器
                if (this.resInterceptor) {
                    return yield this.resInterceptor(response, {
                        headers: assignHeader, responseType, fetchOptions: _fetchOptions, url,
                    });
                }
                else {
                    switch (responseType) {
                        case undefined:
                        case "json":
                            return yield response.json();
                        case "text":
                            return yield response.text();
                        case "stream":
                            return response;
                    }
                }
            }
            catch (err) {
                if (this.errInterceptor) {
                    return this.errInterceptor(err);
                }
                else {
                    console.error(err);
                }
            }
        });
    }
    /**
     * post请求
     * @param data 字段内容
     * @returns
     */
    post(data, reqOption = {}) {
        const { url: reqUrl } = reqOption, reqParam = __rest(reqOption, ["url"]);
        const url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
        return this.fetch(url, "POST", Object.assign({ data }, reqParam));
    }
    /**
     * 删除
     * @param id 需要删除记录的id
     * @returns
     */
    delete(id, data, reqOption = {}) {
        const { url: reqUrl } = reqOption, reqParam = __rest(reqOption, ["url"]);
        const url = reqUrl ? this.url + reqUrl : this.url;
        return this.fetch(`${url}${id ? '/' + id : ''}`, 'DELETE', Object.assign({ data }, reqParam));
    }
    /**
     * 更新update 方法
     * @param id 需要更新记录的id
     * @param data 更新的新的字段对象
     * @returns
     */
    put(id, data, reqOption = {}) {
        const { url: reqUrl } = reqOption, reqParam = __rest(reqOption, ["url"]);
        const url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
        return this.fetch(`${url}${id ? '/' + id : ''}`, "PUT", Object.assign({ data }, reqParam));
    }
    /**
   * 更新patch 方法
   * @param id 需要更新记录的id
   * @param data 更新的新的字段对象
   * @returns
   */
    patch(id, data, reqOption = {}) {
        const { url: reqUrl } = reqOption, reqParam = __rest(reqOption, ["url"]);
        let url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
        return this.fetch(`${url}${id ? '/' + id : ''}`, "PATCH", Object.assign({ data }, reqParam));
    }
    /**
     * 条件查询
     * @param params 查询的条件参数
     * @returns
     */
    get(params, reqOption = {}) {
        const { url: reqUrl } = reqOption, reqParam = __rest(reqOption, ["url"]);
        let url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
        // 拼接get方法请求参数
        if (params) {
            url += '?' + new URLSearchParams(params);
        }
        return this.fetch(url, 'GET', reqParam);
    }
    /**
     * 查询一个
     * @param id 记录id
     * @returns
     */
    getOne(id, params, reqOption = {}) {
        // 拼接get方法请求参数
        const { url: reqUrl } = reqOption, reqParam = __rest(reqOption, ["url"]);
        let url = reqUrl ? this.url + '/' + removeSlash(reqUrl) : this.url;
        id ? url += `/${id}` : undefined;
        // 拼接get方法请求参数
        if (params) {
            url += '?' + new URLSearchParams(params);
        }
        return this.fetch(url, 'GET', reqParam);
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
    create(url) {
        const _a = this.options, { baseUrl, prefix } = _a, props = __rest(_a, ["baseUrl", "prefix"]);
        let _url = '';
        if (prefix) {
            if (baseUrl) {
                _url = `${removeSlash(baseUrl)}/${removeSlash(prefix)}/${removeSlash(url)}`;
            }
            else {
                _url = `/${removeSlash(prefix)}/${removeSlash(url)}`;
            }
        }
        else {
            if (baseUrl) {
                _url = `${removeSlash(baseUrl)}/${removeSlash(url)}`;
            }
            else {
                _url = `/${removeSlash(url)}`;
            }
        }
        return new Request(Object.assign({ url: _url }, props));
    }
}
exports.DesonFetch = DesonFetch;
