# 使用说明

DesonFeth是一款基于fetch api 轻封装的http请求库，封装了一些restful api请求的常用方法，没有任何其他依赖，源码也易懂，完全是我个人的风格习惯。

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

//构造一个实例对象
export const CommonHttp = new DesonFetch({
  baseUrl: 'http://www.baidu.com',
  prefix: 'api', //请求前缀，为了统一所有请求前缀，默认进行了前后去"/"处理，也就是说你传入/api 和/api/ 最终结果是一样的；
  fetchOptions: {
    //原生fetch 剔除body、method、headers选项。 Omit<RequestInit, "body" | "method" | "headers">
    mode: 'cors',
    credentials: 'include',
  },
  /*  响应拦截器response.ok===true会执行此函数，如果不传此函数，默认请求options（下文会介绍这个options）中没有responseType或者responseType等于json的
  时候会执行
  await response.json()
  建议传此函数自行处理响应结果。
  */

  async resInterceptor(response, options) {
    const { responseType } = options!;
    // 请求成功示例
    if (response.status === 200) {
      try {
        const resData: ResponseStructure = await response.json();
        const { statusCode, data, message } = resData;
        if (statusCode === 200) {
          return data;
        } else {
          Toast.show({
            icon: 'fail',
            content: message,
          });
        }
      } catch (error) {
        console.warn('转换请求结果出错', error);
      }
    } else {
      // 其他响应码
    }
  },
  //错误拦截，此拦截只会在fetch请求失败的时候进行拦截也就是response.ok!==true的情况下才执行
  errInterceptor(err) {
    console.warn(err);
    Toast.show({
      icon: 'fail',
      content: err.message,
    });
  },
});
//构造完一个基础的请求实例，可以基于这个实例创建restful风格接口请求对象
const PostApi = CommonHttp.create('/post'); //PostApi对象拥有post、delete、get、put、patch、getOne请求方法;
GoodsApi.post(data, options); // 会发送一个post请求http://www.baidu.com/api/post，第一个参数为发送的数据，第二个参数下面说明;
/*
 这里说一下每个请求都有的options参数，这是一个可选参数，如果传入该参数请在请求方法的最后一个参数位传入，例如post方法在第二个参数位，put和delete方法在第三个，该参数为一个对象：
 {
 	url:string, //如果你想发送到http://www.baidu.com/api/post/popular，url这里写popular，内部会拼接地址;
 	ResponseType : "json" | 'stream' | 'text',//如果在构造的时候没有写响应resInterceptor拦截器，内部默认会把响应结果执行response.json()，如果传入stream会直接返回response方便用户自行处理下载等操作。
 	headers：//请求头对象没啥好说的。
 	fetchOptions：fetch请求参数剔除了body、method、headers选项，参考 https://developer.mozilla.org/zh-CN/docs/Web/API/fetch
  }
 */
//由于每个options位于请求方法最后一个参数，如果不需要发送请求参数，但是需要定义options，请求参数位置可以传undefined
get(params?:Record<string,string>,options?);//get请求，params参数为queryString组合对象
getOne(id:number|string,params?:Record<string,string>,options?)
post(data?::Record<string,any>|FormData,options) //post请求
put(id:number|string,data?:Record<string,any>|FormData,options?) //put请求
patch(id:number|string,data?:Record<string,any>|FormData,options?) //patch请求
delete(id:number|string,data?:Record<string,any>|FormData,options?) //delete请求
```

