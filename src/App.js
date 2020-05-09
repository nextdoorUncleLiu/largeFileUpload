import React, { useState } from 'react'
import { Upload, Button, Progress } from 'antd';
import 'antd/dist/antd.css';
import { UploadOutlined } from '@ant-design/icons';
import LargeFileUpload from './LargeFileUpload'
import './App.css'

let largeFileUpload = new LargeFileUpload()
function App() {
  const [progressList, setProgressList] = useState([])
  const props = {
    name: 'file',
    action: '',
    fileList: [],
    customRequest: file => {
      setProgressList([])
      largeFileUpload.addFile({
        file,
        sliceSize: 1024 * 10,
        setProgressList
      })
      console.log(largeFileUpload)
    }
  };
  return (
    <>
      <Upload {...props}>
        <Button>
          <UploadOutlined /> Click to Upload
        </Button>
      </Upload>
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
      
    </>
  )
}
export default App;
