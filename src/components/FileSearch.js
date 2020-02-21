import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

const FileSearch = ({ title, onFileSearch }) => {
    const [inputActive, setInputActive] = useState(false)
    const [value, setValue] = useState('')

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    let node = useRef(null)

    const closeSearch = () => {
        setInputActive(false)
        setValue('')
        onFileSearch('')
    }
    useEffect(() => {
        if (enterPressed && inputActive) {
            console.log('searching')
            onFileSearch(value)
        }
        if (escPressed && inputActive) {
            closeSearch()
        }
    })

    useEffect(() => {
        if (inputActive) {
            node.current.focus()
        }
    }, [inputActive])

    return (
        <div className="alert alert-primary mb-0">
            {!inputActive &&
                <div className="d-flex justify-content-between align-items-center mb-0">
                    <span>{title}</span>
                    <button type="button" className="icon-button"
                        onClick={() => { setInputActive(true) }}
                    >
                        <FontAwesomeIcon icon={faSearch} title="搜索" />
                    </button>
                </div>
            }
            {
                inputActive &&
                <div className="d-flex justify-content-between align-items-center mb-0">
                    <input className="form-control form-xs"
                        value={value}
                        ref={node}
                        onChange={(e) => { setValue(e.target.value) }}
                    />
                    <button
                        type="button"
                        className="icon-button"
                        onClick={(e) => { closeSearch(e) }}>
                        <FontAwesomeIcon icon={faTimes} title="关闭" />
                    </button>
                </div>
            }
        </div>
    )
}
FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired
}
FileSearch.defaultProps = {
    title: '我的云文档'
}
export default FileSearch