import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import uuidv4 from 'uuid/v4'

import { objToArr, flattenArr, timestampToString } from './utils/helper'
import fileHelper from './utils/fileHelper';
import useIpcRenderer from './hooks/useIpcRenderer'
import Loader from './components/Loader'
const { join, basename, extname } = window.require('path')
const { remote } = window.require('electron')
const { ipcRenderer } = window.require('electron')
const Store = window.require('electron-store')
const fileStore = new Store({ 'name': 'Files Data' })
const settingsStore = new Store({ name: 'Settings' })
const saveFiesToStore = (files) => {
  const fileStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createAt, isSynced, updateAt } = file
    result[id] = {
      id, path, title, createAt, isSynced, updateAt
    }
    return result
  }, {})
  fileStore.set('files', fileStoreObj)
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unsavedFileIds, setUnsavedFileIds] = useState([])
  const [searchedFiles, setSearchedFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const filesArr = objToArr(files)
  const savedLocation = remote.app.getPath('documents')
  const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))

  const openedFiles = openedFileIds.map(openId => {
    return files[openId]
  })
  const activeFile = files[activeFileId]
  const fileClick = (fileId) => {
    setActiveFileId(fileId)
    const currentFile = files[fileId]
    const { id, title, path, isLoaded } = currentFile
    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper.readFile(currentFile.path).then((data) => {
          const newFile = { ...files[fileId], body: data, isLoaded: true }
          setFiles({ ...files, [fileId]: newFile })
        })
      }
    }
    if (!openedFileIds.includes(fileId)) {
      setOpenedFileIds([...openedFileIds, fileId])
    }
  }
  const tabClick = (fileId) => {
    setActiveFileId(fileId)
  }
  const tabClose = (fileId) => {
    const tabsWithout = openedFileIds.filter(id => fileId !== id)
    setOpenedFileIds(tabsWithout)

    if (tabsWithout.length > 0) {
      setActiveFileId(tabsWithout[0])
    } else {
      setActiveFileId()
    }
  }
  const fileChange = (id, value) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })

      if (!unsavedFileIds.includes(id)) {
        setUnsavedFileIds([...unsavedFileIds, id])
      }
    }
  }
  const deleteFile = (id) => {
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFiesToStore(afterDelete)
        tabClose(id)
      })
    }
  }

  const updateFileName = (id, title, isNew) => {
    const newPath = join(savedLocation, `${title}.md`)
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFiesToStore(newFiles)
      })
    } else {
      const oldPath = join(savedLocation, `${files[id].title}.md`)
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFiesToStore(newFiles)
      })
    }
  }

  const fileSearch = (keyword) => {
    const newFiles = filesArr.filter(file => file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }

  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr;


  const createNewFile = () => {
    const newId = uuidv4()
    const newFile = {
      id: newId,
      title: '',
      body: '## 请输入 Markdown',
      createAt: new Date().getTime(),
      isNew: true
    }
    setFiles({ ...files, [newId]: newFile })
  }

  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(join(savedLocation, `${activeFile.title}.md`), activeFile.body).then(() => {
      setUnsavedFileIds(unsavedFileIds.filter(id => id !== activeFileId))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', { key: `${title}.md`, path })
      }
    })
  }

  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: ' 选择导入的Markdown文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }).then(result => {
      if (Array.isArray(result.filePaths)) {
        const filteredPaths = result.filePaths.filter(path => {
          const aleadyAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !aleadyAdded
        })
        console.log(filteredPaths)

        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path: path
          }
        })

        const newFiles = { ...files, ...flattenArr(importFilesArr) }
        setFiles(newFiles)
        saveFiesToStore(newFiles)

        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length} 个文件`,
            message: `成功导入了${importFilesArr.length} 个文件`,
          })
        } else {
          console.log(importFilesArr)
        }
      }
    })
  }

  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiedFile = { ...files[id], isSynced: true, updateAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFiesToStore(newFiles)
  }
  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if (message.status === 'download-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updateAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true }
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFiesToStore(newFiles)
    })
  }
  const filesUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime()
      result[file.id] = { ...file, isSynced: true, updateAt: currentTime }
      return result
    }, {})

    setFiles(newFiles)
    saveFiesToStore(newFiles)
  }
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'search-file': fileSearch,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'loading-status': (message, status) => { debugger; setIsLoading(status) },
    'files-uploaded': filesUploaded
  })

  return (
    <div className="App container-fluid px-0">
      {isLoading &&
        <Loader text="处理中" />
      }
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch
            onFileSearch={(value) => { fileSearch(value) }}
          />
          <FileList
            files={fileListArr}
            onFileClick={(id) => { fileClick(id) }}
            onFileDelete={(id) => { deleteFile(id) }}
            onSaveEdit={updateFileName}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottomBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>

          </div>
        </div>
        <div className="col-9 right-panel">
          {
            !activeFile &&
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>
          }
          {
            activeFile &&
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileId}
                unsavedIds={unsavedFileIds}
                onTabClick={(id) => { tabClick(id) }}
                onCloseTab={(id) => { tabClose(id) }}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                onChange={(value) => { fileChange(activeFile.id, value) }}
                options={{
                  minHeight: "500px"
                }}
              />
              {activeFile.isSynced &&
                <span className="sync-status">已同步，上次同步时间：{timestampToString(activeFile.updateAt)}</span>
              }
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
