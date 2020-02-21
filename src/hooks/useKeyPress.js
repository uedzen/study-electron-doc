import { useState, useEffect } from 'react'

const useKeyPress = (targetKeyCode) => {
    const [keyPressed, setKeyPressed] = useState(false)

    const keyDownHanlder = ({ keyCode }) => {
        if (keyCode === targetKeyCode) {
            setKeyPressed(true)
        }
    }
    const keyUpHanlder = ({ keyCode }) => {
        if (keyCode === targetKeyCode) {
            setKeyPressed(false)
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', keyDownHanlder)
        document.addEventListener('keyup', keyUpHanlder)
    }, [])

    return keyPressed
}

export default useKeyPress