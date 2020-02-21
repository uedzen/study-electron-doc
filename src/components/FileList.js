import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState('')

    const enterPressed = useKeyPress(13)
    const ecsPressed = useKeyPress(27)
    const node = useRef(null)

    const closeSearch = (editItem) => {
        setEditStatus(false)
        setValue('')
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }

    const clickElement = useContextMenu([
        {
            label: '打开',
            click: () => {
                const parentElement = getParentNode(clickElement.current, 'file-item')
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }
            }
        }
        , {
            label: '打开',
            click: () => {
                console.log('clicking')
            },
        },
        {
            label: '打开',
            click: () => {
                console.log('clicking')
            }
        }
    ], '.file-list', files)

    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
        }
        if (ecsPressed && editStatus) {
            closeSearch(editItem)
        }
    })
    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])

    useEffect(() => {
        if (editStatus) {
            node.current.focus()
        }
    }, [editStatus])

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item bg-light d-flex align-items-center file-item row mx-0"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}>
                        {
                            (file.id !== editStatus && !file.isNew) &&
                            <>
                                <span className="col-2">
                                    <FontAwesomeIcon icon={faMarkdown} size="lg" />
                                </span>
                                <span className="col-7 c-link"
                                    onClick={() => { onFileClick(file.id) }}
                                >{file.title}</span>
                                <button type="button" className="icon-button col-1"
                                    onClick={() => { setEditStatus(file.id); setValue(file.title) }}>
                                    <FontAwesomeIcon icon={faEdit} title="编辑" />
                                </button>
                                <button type="button" className="icon-button col-1"
                                    onClick={() => { onFileDelete(file.id) }}>
                                    <FontAwesomeIcon icon={faTrash} title="删除" />
                                </button>
                            </>
                        }
                        {
                            (file.id === editStatus || file.isNew) &&
                            <>
                                <input className="form-control col-10"
                                    value={value}
                                    ref={node}
                                    placeholder="请输入文件名称"
                                    onChange={(e) => { setValue(e.target.value) }}
                                />
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={() => { closeSearch(file) }}>
                                    <FontAwesomeIcon icon={faTimes} title="关闭" />
                                </button>
                            </>
                        }
                    </li>
                ))
            }
        </ul>
    )
}
FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func
}
export default FileList