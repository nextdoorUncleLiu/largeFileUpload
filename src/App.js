import React, { useState } from 'react'
import { Upload, Button, Progress } from 'antd';
import 'antd/dist/antd.css';
import { UploadOutlined } from '@ant-design/icons';
import LargeFileUpload from './LargeFileUpload'
import axiosInstance from './initOptions'
// eslint-disable-next-line
import './App.css'

let largeFileUpload = new LargeFileUpload()

function App() {
  const [progressList, setProgressList] = useState([])
  const [largeProgress, setLargeProgress] = useState(0)
  const props = {
    name: 'file',
    action: '',
    fileList: [],
    customRequest: file => {
      setProgressList([])
      largeFileUpload.init()
      largeFileUpload.addFile({
        file,
        sliceSize: 1024 * 20,
        setProgressList,
        totalConcurrent: 10
      })
      console.log(largeFileUpload)
    }
  };
  const props2 = {
    name: 'file',
    action: '',
    fileList: [],
    customRequest: file => {
      const { filename } = file.file
      let formData = new FormData()
      formData.set('file', file.file, filename)
      // 切片文件后端存放位置
      formData.set('foldname', new Date().getTime() + '')
      axiosInstance({
        url: '/file',
        method: 'post',
        header: {
            "Content-Type": "multipart/form-data"
        },
        onUploadProgress: e => {
            const { loaded, total } = e
            setLargeProgress(Math.ceil(loaded / total * 100))
        },
        data: formData
      })
    }
  };
  const totalProgress = progressList.map(item => item.progress).reduce(function(prev, curr){
    return prev + curr;
  }, 0)
  console.log(totalProgress)
  return (
    <div className="file-container">
      <div>
        <Upload {...props}>
          <Button>
            <UploadOutlined /> 切片文件上传
          </Button>
        </Upload>
        <div onClick={() => console.log(123)}>
          <p>总进度</p>
          <Progress percent={totalProgress / progressList.length}/>
        </div>
        <div>
          <p>切片进度</p>
          {progressList.length ? 
            <div className="slice-list-container">
              {progressList.map((item, index) => {
                  return (
                    <>
                      <span>{item.filename}</span>
                      <Progress key={index} percent={item.progress} status={item.status ? "active" : "exception"} />
                      
                      {item.status ?
                        "" :
                        <Button onClick={() => { largeFileUpload.updateFile(item) }}>重试</Button>
                      }
                    </>
                  )
                })
              }
              <Button onClick={() => largeFileUpload.retryAll()}>重试全部</Button>
            </div> :
            ''
          }
        </div>
      </div>
      <div>
        <Upload {...props2}>
          <Button>
            <UploadOutlined /> 整文件上传
          </Button>
        </Upload>
        <p>总进度</p>
        <Progress percent={largeProgress} />
      </div>
    </div>
  )
}
export default App;
