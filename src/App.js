import React from 'react'
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import LargeFileUpload from './LargeFileUpload'
const props = {
  name: 'file',
  action: '',
  customRequest: function(file) {
    new LargeFileUpload({file})
  }
};

function App() {
  return (
    <Upload {...props}>
      <Button>
        <UploadOutlined /> Click to Upload
      </Button>
    </Upload>
  )
}
export default App;
