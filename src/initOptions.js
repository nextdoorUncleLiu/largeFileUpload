import axios from 'axios'
const initOptions = {
    baseURL: '/api',
    method: 'get',
    transformRequest: [function (data) {
        // 在请求前格式化表头或者请求参数
        return data;
    }],
    transformResponse: [function (data) {
        // 在接口响应后格式化返回结果
        return data;
    }],
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json'
    },
    params: {},
    timeout: 50000,
    withCredentials: true,
    responseType: 'json',
    responseEncoding: 'utf8',
    onUploadProgress: function (progressEvent) {
        // 上传进度
        return progressEvent;
    },
    onDownloadProgress: function (progressEvent) {
        // 下载进度return
        return progressEvent;
    },
    maxContentLength: 2000,
    validateStatus: function (status) {
        return status >= 200 && status < 300;
    },
    maxRedirects: 5, // 最大重定向次数
}

function axiosInstance(options) {
    return axios(Object.assign({}, initOptions, options))
}

export default axiosInstance