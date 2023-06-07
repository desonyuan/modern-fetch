# 使用说明

DesonFeth是一款基于fetch api 轻封装的http请求库，封装了一些restful api请求的常用方法，没有任何其他依赖，源码也易懂，完全是我个人的风格习惯,适用于browser、nodejs>=18、bun、deno、react native。

### 安装npm包

```typescript
npm install @deson/fetch --save
```

### 使用

```typescript
//使用示例
import { DesonFetch } from '@deson/fetch';

//与后端约定的响应格式
interface ResponseStructure {
  statusCode: number;
  data: any;
  message: string;
}
//类型定义
type Methods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE' | "HEAD";
type DataType = Record<string, any> | FormData;
type HeaderType = Record<string, string>;
type IFetchOption = Omit<RequestInit, "body" | "method" | "headers"> //fetch 请求参数去除 "body" | "method" | "headers"
type ResponseType = "json" | "text" | "formData" | "blob" | "arrayBuffer"
type RequestConfig={  headers: HeaderType ;fetchOptions: IFetchOption; responseType: ResponseType,data?:DataType;url:string,method:Methods }
//构造一个实例对象 构造参数内的选项均为可选参数
export const CommonHttp = new DesonFetch({
  baseUrl: 'http://www.baidu.com',//该实例的请求地址
  prefix: 'api', //请求前缀，为了统一所有请求前缀，默认进行了前后去"/"处理，也就是说你传入/api 和/api/ 最终结果是一样的；
  fetchOptions: {//原生fetch 剔除body、method、headers选项。 Omit<RequestInit, "body" | "method" | "headers">
    mode: 'cors',
    credentials: 'include',
  },
  /*
   *请求拦截器，每次发送请求都会执行该函数,常用修改请求参数
   *@return RequestConfig
  */
 async resInterceptor(config:RequestConfig){
  config.headers.authorization=token;
  return config
 }

  /* 响应拦截器
  *如果不传此函数，默认请求参数options中没有responseType或者responseType等于json的时候会执行 await response.json()
  *建议传此函数自行处理响应结果。
  */
  async resInterceptor(response, options) {
    const { responseType } = options!;
    // 请求成功示例
    if (response.ok) {
       if(!responseType||responseType==="json"){
            const resData: ResponseStructure = await response.json();
            const { statusCode, data, message } = resData;
            if (statusCode === 200) {
              return data;
            } else {
              Toast.show({
                icon: 'fail',
                content: message,
              });
              return Promise.reject()
            }
        }else{
          // 其他响应类型处理
        }
    } else {
      return Promise.reject();
    }
  },
  //请求错误拦截，
  errInterceptor(err) {
    Toast.show({
      icon: 'fail',
      content: err.message,
    });
    return Promise.reject()
  },
});
/**
 * 创建restful风格接口请求对象
 * PostApi对象拥有post、delete、get、put、patch请求方法;
 * 每个请求方法接收两个参数:PostApi.[method](data?:Record<string,any>|string, option:{data?Record<string,any>; headers?: HeaderType;fetchOptions?: Omit<RequestInit, "body" | "method" | "headers">});
 * 第一个参数可以是object或者string，第二个参数可以传入headers（object对象），和fetchOptions（fetch参数）选项;
 * 第一个参数如果为string则视为请求url,例:PostApi.post('hot',option)会发送post请求到http://www.baidu.com/news/hot,如果需要发送请求参数则再option中传入{data:{xxx}}
 * 第一个参数如果为object则视为请求参数(此时忽略options中的data参数),例:PostApi.get({ id:1 },option)会发送post请求到http://www.baidu.com/news?id=1,
 */
const PostApi = CommonHttp.create('/news');

```

