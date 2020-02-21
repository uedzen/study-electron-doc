const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    dialog
} = require('electron')
const Store = require('electron-store')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })

const menuTemplate = require('./src/menuTemplate')
const isDev = require('electron-is-dev')
const path = require('path')
const AppWindow = require('./src/AppWindow')
const QiniuManager = require('./src/utils/QiniuManager')
let mainWindow, settingsWindow;
let createManager = () => {
    const accessKey = settingsStore.get('accessKey')
    const secretKey = settingsStore.get('secretKey')
    const bucketName = settingsStore.get('bucketName')

    return new QiniuManager(accessKey, secretKey, bucketName)
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        webPreferences: {
            nodeIntegration: true
        }
    })

    const urlLocation = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, './index.html')}`
    mainWindow.loadURL(urlLocation)

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            modal: true,
            parent: mainWindow
        }
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.removeMenu()
        settingsWindow.on('closed', () => {
            settingsWindow = null
        })
    })

    ipcMain.on('config-is-saved', () => {
        // watch out menu items index for mac and windows
        let qiniuMenu = process.platform === 'darwin' ? menu[3] : menu.items[2]
        const switchItems = (toggle) => {
            [1, 2, 3].forEach(number => {
                qiniuMenu.submenu.items[number].enabled = toggle
            })
        }
        const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
        switchItems(qiniuIsConfiged)
    })

    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager()
        const { key, path } = data
        manager.uploadFile(key, path).then((value) => {
            console.log('上传成功', value)
            mainWindow.webContents.send('active-file-uploaded')
        }).catch((err) => {
            console.log(err)
            dialog.showErrorBox('同步失败', '请检查参数是否正确')
        })
    })
    ipcMain.on('download-file', (event, data) => {
        const { key, path, id } = data
        const manager = createManager()
        const filesObj = fileStore.get('files')

        manager.getStat(key).then((resp) => {
            const serverUpdateTime = Math.round(resp.putTime / 10000)
            const localUpdateTime = filesObj[id].updateAt
            if (serverUpdateTime > localUpdateTime || !localUpdateTime) {
                console.log('download new file')
                manager.downloadFile(key, path).then(() => {
                    mainWindow.webContents.send('file-downloaded', { status: 'download-success', id })
                })
            } else {
                mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id })
            }
        }, (error) => {
            console.log(error)
            if (error.statusCode === 612) {
                mainWindow.webContents.send('file-downloaded', { status: 'no-file', id })
            }
        })
    })

    ipcMain.on('upload-all-to-qiniu', () => {
        mainWindow.webContents.send('loading-status', true)
        const filesObj = fileStore.get('files') || {}
        const manager = createManager()
        const uploadPromiseArr = Object.keys(filesObj).map(key => {
            const file = filesObj[key]
            return manager.uploadFile(`${file.title}.md`, file.path)
        })
        Promise.all(uploadPromiseArr).then(result => {
            console.log(result)
            dialog.showMessageBox({
                type: 'info',
                title: `成功上传了${result.length}个文件`,
                message: `成功上传了${result.length}个文件`,
            })
            mainWindow.webContents.send('files-uploaded')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查参数是否正确')
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false)
        })
    })
})