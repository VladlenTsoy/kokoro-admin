import {motion} from "framer-motion"
import React from "react"

interface Props {
    children: React.ReactNode
}

const MotionCheckAnimation:React.FC<Props> = ({children}) => {
    return (
        <motion.span
            animate={{opacity: 1, x: 0}}
            initial={{opacity: 0, x: -20}}
            exit={{opacity: 0, x: -20}}
            key="icon"
        >
            {children}
        </motion.span>
    )
}

export default MotionCheckAnimation