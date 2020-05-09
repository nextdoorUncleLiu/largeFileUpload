import axiosInstance from './initOptions'
  
export default class LargeFileUpload {
    constructor() {
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
        this.init()
    }
    init() {
        this._sliceSize = null
        this._sliceOrder = 0 //切割多少份
        this._metaFile = null
        this.setProgressList = null
        let target = {
            count: 0
        }
        let handler = {
            set: this.setConcurrent.bind(this)
        }
        this._concurrentRequest = new Proxy(target, handler) // 监听并始终保持最高数量请求
        this._sliceList = [] // 切片队列
        this._progressList = [] // 进度队列
        this._folder = new Date().getTime() + ''
    }
    addFile({ file, sliceSize = 1, totalConcurrent = 2, setProgressList }) {
        this._sliceSize = sliceSize * 1024 // 切割每份大小
        this._metaFile = file.file // 源文件
        this._totalConcurrent = totalConcurrent //总并发
        this.setProgressList = setProgressList
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
            let file = _metaFile.slice(start, i * _sliceSize)
            let filename = `${i}-${_metaFile.name}`
            let obj = {
                index: i,
                file,
                filename,
                progress: 0,
                status: true
            }
            this._sliceList.push(obj)
            this._progressList.push(obj)
            start = end
        }
        this.setProgressList(this._progressList)
        this.startConcurrent()
    }
    /**
     * startConcurrent 初始化执行最大并发
     */
    startConcurrent() {
        for (let i = 0; i < this._totalConcurrent; ++i) {
            this.sliceRefresh()
        }
    }
    // 设置接口数据
    setFormData(file) {
        const { filename } = file
        let formData = new FormData()
        formData.set('file', file.file, filename)
        // 切片文件后端存放位置
        formData.set('foldname', this._folder)
        return formData
    }
    // 更新进度并渲染
    updateProgress(file) {
        let curProgress = this._progressList[file.index - 1]
        return {
            'progress': progress => {
                curProgress.progress = progress
                this.setProgressList([...this._progressList])
            },
            'status': status => {
                curProgress.status = status
                this.setProgressList([...this._progressList])
            }
        }
    }
    /**
     * uploadFile 上传文件
     * @param {file} file 对象
     */
    uploadFile(file) {
        const curProgress = this.updateProgress(file)
        curProgress['progress'](0)
        axiosInstance({
            url: '/blob',
            method: 'post',
            header: {
                "Content-Type": "multipart/form-data"
            },
            onUploadProgress: e => {
                const { loaded, total } = e
                curProgress['progress'](Math.ceil(loaded / total * 100))
            },
            data: this.setFormData(file)
        }).then(() => {
            if (!file.status) {
                // 修改进度状态并更新
                curProgress['status'](true)
                // 获取当前在切片列表的位置
                let curIndex = this._sliceList.findIndex(value => {
                    return value.index === file.index
                })
                // 从切片列表删除当前切片
                this._sliceList.splice(curIndex, 1)
                // 由于之前上传失败没有减 1 ，所以在重新上传就等于是二次操作，多减 1
                this._concurrentRequest.count -= 1
            } else {
                // 只有在初始化上传
                this._concurrentRequest['flowType'] = 'done'
            }
            this._concurrentRequest.count -= 1
            
        }).catch(() => {
            // 保证失败上传的计数只会多 1，而不是叠加
            if (!curProgress.status) {
                this._concurrentRequest.count -= 1
            }
            this._concurrentRequest['flowType'] = 'done'
            curProgress['status'](false)
        })
    }
    /**
     * updateFile 更新文件上传
     * @param {object} file 重试单文件
     */
    updateFile(file) {
        this._sliceList.push(file)
        this.uploadFile(file)
    }
    /**
     * retryAll 重试所有失败的切片上传
     */
    retryAll() {
        this._sliceList = this._progressList.filter(item => !item.status)
        this.startConcurrent()
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
        axiosInstance({
            url: '/merge',
            method: 'post',
            data: JSON.stringify({
                foldname: this._folder
            })
        })
    }
}