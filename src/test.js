const qiniu = require('qiniu')
const path = require('path')
const QiniuManager = require('./utils/QiniuManager')
var accessKey = 'HkECRlvHaW1Qoo1y2bCPpAiGHqQPjopGCxo58107'
var secretKey = '7aH2Ekpu5lvMuVZTJ3WAoKK2QTMsHffzP17hrMUJ'
var bucket = 'markdow-doc'
var localFile = 'C:\\Users\\ms\\Documents\\1234.md'
var key = '12345678.md'
var downloadPath = path.join(__dirname, key)
const manager = new QiniuManager(accessKey, secretKey, bucket)
// manager.uploadFile(key, localFile)
// manager.deleteFile(key)
// manager.uploadFile(key, localFile).then((data) => {
//     console.log('上传成功', data)
//     return manager.deleteFile(key)
// }).then((data) => {
//     console.log('删除成功', data)
// })
// manager.generateDownloadLink(key).then((data) => {
//     console.log(data)
//     return manager.generateDownloadLink('first.md')
// }).then((data) => {
//     console.log(data)
// })

// manager.downloadFile(key, downloadPath)
// manager.downloadFile('12345', downloadPath).catch(err => {
//     console.log(err)
// })

manager.uploadFile(key, localFile)