import axiosInstance from './initOptions'
  
export default class LargeFileUpload {
    constructor({ file, sliceSize = 4, totalConcurrent = 2 }) {
        this._sliceSize = sliceSize // 切割每份大小
        this._sliceOrder = 0 //切割多少份
        this._metaFile = file.file // 源文件
        this._totalConcurrent = totalConcurrent //总并发
        this._flowTypeHandle = {
            'add': () => {
                console.log('添加一项')
                return false
            },
            'done': () => {
                console.log('完成一项')
                this.sliceRefresh()
                return false
            }
        }
        let target = {
            count: 0
        }
        let handler = {
            set: this.setConcurrent.bind(this)
        }
        this._concurrentRequest = new Proxy(target, handler) // 监听并始终保持最高数量请求
        this._sliceList = [] // generator 队列
        this.sliceFile()
    }
    /**
     * sliceFile 切片文件
     */
    sliceFile () {
        let {
            _sliceOrder,
            _sliceSize,
            _metaFile
        } = this
        let start = 0
        let size = _metaFile.size
        // 需要的上传次数
        _sliceOrder = Math.ceil(size / _sliceSize)
        for (let i = 1; i <= _sliceOrder; ++i) {
            let end = i * _sliceSize
            // 每一个切片文件添加到上传队列
            let formData = new FormData()
            formData.set('file', _metaFile.slice(start, i * _sliceSize), `${i}-${_metaFile.name}`)
            this._sliceList.push(formData)
            start = end
        }
        this.startConcurrent()
    }
    /**
     * startConcurrent 初始化执行最大并发
     */
    startConcurrent() {
        for (let i = this._concurrentRequest.count; i < this._totalConcurrent; ++i) {
            this.sliceRefresh()
        }
    }
    /**
     * uploadFile 上传文件
     * @param {formData} formData 文件
     */
    uploadFile(formData) {
        axiosInstance({
            url: '/blob',
            method: 'post',
            header: {
                "Content-Type": "multipart/form-data"
            },
            data: formData
        }).then(() => {
            this._concurrentRequest['flowType'] = 'done'
            --this._concurrentRequest.count
        })
    }
    /**
     * setConcurrent 设置并发
     * @param {object} target 拦截器对象
     * @param {string} property 拦截器属性
     * @param {string | number} value 拦截器值
     */
    setConcurrent(target, property, value) {
        switch(property) {
            case 'flowType': // 对应类型的事件处理
                this._flowTypeHandle[value]()
                break
            case 'count': // 当前并发数，如果等于0说明已经全部上传完成
                if (!value) {
                    this.mergeFile()
                }
                break
            default:
                break
        }
        target[property] = value
        return true
    }
    /**
     * sliceRefresh 切片刷新
     */
    sliceRefresh() {
        const { _sliceList, _concurrentRequest } = this
        // 执行中进行
        if (_sliceList.length) {
            _concurrentRequest['flowType'] = 'add'
            ++_concurrentRequest.count
            this.uploadFile(_sliceList.shift())
        }
    }
    /**
     * mergeFile 合并文件
     */
    mergeFile() {
        console.log('合并文件')
    }
}