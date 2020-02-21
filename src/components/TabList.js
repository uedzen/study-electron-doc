import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './TabList.scss'
const TabList = ({ files, activeId, unsavedIds, onTabClick, onCloseTab }) => {
    return (
        <ul className="nav nav-pills tablist-component">
            {
                files.map(file => {
                    const withUnsavedMask = unsavedIds.includes(file.id)
                    const fClassName = classNames({
                        'nav-link': true,
                        'active': file.id === activeId,
                        'withUnsaved': withUnsavedMask
                    })
                    return (
                        <li className="nav-item" key={file.id}>
                            <a href="#" className={fClassName}
                                onClick={(e) => { e.preventDefault(); onTabClick(file.id) }}
                            >
                                {file.title}
                                <span className="ml-2 close-icon"
                                    onClick={(e) => { e.stopPropagation(); onCloseTab(file.id) }}
                                >
                                    <FontAwesomeIcon
                                        icon={faTimes}
                                    />
                                </span>
                                {
                                    withUnsavedMask &&
                                    <span className="ml-2 rounded-circle unsaved-icon"></span>
                                }
                            </a>
                        </li>
                    )
                })
            }
        </ul>

    )
}

TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unsavedIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func
}
TabList.defaultProps = {
    unsavedIds: []
}

export default TabList