# 使用说明

ModernFetch是一款基于fetch api 轻封装的http请求库，封装了一些restful api请求的常用方法，没有任何其他依赖，源码也易懂，完全是我个人的风格习惯,适用于browser、nodejs>=18、bun、deno、react native。

### 安装npm包

```typescript
npm install modern-fetch --save
```

### 内部的类型定义

```typescript
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
type DataType = RequestInit['body'];
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers"> //fetch RequestInit 剔除body、method、headers选项。
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer"| undefined //响应数据类型

type RequestOption = { headers?: HeaderType; fetchOptions?: IFetchOption; responseType?: ResponseType, data?: DataType } //调用请求方法的第二个参数

type ReqInterceptor= (requestInit: IRequestInit, url: string) => Promise<IRequestInit>
type ResInterceptor = <T = any>(response: Response, responseType: ResponseType, retry: () => Promise<T>) => Promise<any>
type ErrInterceptor = (err: any) => void
type Transform= (data: any, method?: Methods, url?: string) => any

interface IFactoryOption {
  headers?: HeaderType
  fetchOptions?: IFetchOption,
  reqIntcp?: ReqInterceptor
  resIntcp?: ResInterceptor
  errIntcp?:ErrInterceptor
  transform?: Transform
}
```
### 使用示例
```typescript
//初始化，构造基础实例对象 构造参数为可选参数  new ModernFetch(options?:IFactoryOption)
export const CommonHttp = new ModernFetch({
  baseUrl: 'http://www.baidu.com',//该实例的请求地址
  prefix: 'api', //请求前缀
  fetchOptions: {
    mode: 'cors',
    credentials: 'include',
  },
});

// 添加请求拦截,每次发送请求都会执行该函数,常用修改请求配置参数，例如修改请求头
CommonHttp.addReqIntcp(async (config:RequestInit,reqUrl:string))=>{
  config.headers.set('token', '123456');
  return config
 })

//  添加响应拦截,每次响应都会执行该函数
CommonHttp.addResIntcp(async (response,responseType, retry/* retry是一个函数，可以再次发起本次请求 */))=>{
     // 请求成功示例
    if (response.ok) {
      if(responseType === 'json'){
        return await response.json()
      }else if(responseType === 'text'){
        return await response.text()
      }else{
        // other processing
      }
      // 重新请求示例:refresh token过期，retry可以再次发起本次请求
      if(response.status === 401){
        await RefreshToken();
        return await retry();
      }
    } else {
      return Promise.reject(response);
    }
 })

//  添加请求错误拦截
CommonHttp.addErrIntcp((err)=> {
    Toast.show({
      icon: 'fail',
      content: err.message,
    });
  })

//你可能会创建多个实例，每个实例都写一次拦截器，比较麻烦，为此ModernFetch上有3个方法可以添加全局拦截器，当有全局拦截和实例拦截器都存在，执行实例拦截器，全局拦截器不执行。

ModernFetch.addGlobalReqIntcp(interceptor: ReqInterceptor)
ModernFetch.addGlobalResIntcp(interceptor: ResInterceptor)
ModernFetch.addGlobalErrIntcp(interceptor: ErrInterceptor)

/**
 * 基于上面创建的CommonHttp创建请求对象
 * PostApi对象拥有post、delete、get、put、patch请求方法;
 * 每个请求方法接收两个参数:PostApi.[method](data:RequestInit['body'], option:RequestOption);
 * 第一个参数如果为RequestInit['body']则视为请求参数(此时忽略option参数中的data参数),例:PostApi.get({ id:1 },option)会发送post请求到http://www.baidu.com/news?id=1,
 * 第一个参数如果为string则视为追加的url,例:PostApi.post('hot',option)会发送post请求到http://www.baidu.com/news/hot,如果需要发送请求参数则在第二个参数中传入{data:RequestInit['body']}
 */
const PostApi = CommonHttp.create('/news');

//示例1：发送get请求 http://www.baidu.com/api/news
PostApi.get()
//示例2：发送get请求携带id参数， http://www.baidu.com/api/news?id=1
PostApi.get({id: 1})
//示例3：发送get请求news/hot并携带id参数， http://www.baidu.com/api/news/hot?id=1
PostApi.get('hot',{data:{id: 1}})
//示例4：发送FormData
PostApi.post(new FormData())
//示例5：发送Blob
PostApi.post('file',{data:new Blob()})
//示例6：发送ArrayBuffer
PostApi.post(ArrayBuffer)
//示例7：文件下载 http://www.baidu.com/api/news/pic.jpge
PostApi.get('pic.jpge',{responseType:'blob'})
```
### 自定义Url请求
```typescript
//每一个请求对象都有一个request方法，这个方法的url不受baseUrl和perfix影响。
PostApi.request(url: string, requestInit:RequestInit,responseType?: ResponseType)
```
### fetch api 使用参考
[fetch api MDN](https://developer.mozilla.org/en-US/docs/Web/API/fetch#syntax)