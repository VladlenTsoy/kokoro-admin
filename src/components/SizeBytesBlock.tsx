import React from "react"
import cn from "classnames"
import {bytesToSize} from "../utils/bytesToSize.ts"
import {createStyles} from "antd-style"

const useStyles = createStyles(({css, cx, token}) => {
    const photoSize = cx(css`
        display: flex;
        align-items: center;
        padding: 0 0.25rem;
        position: absolute;
        z-index: 4;
        top: 15px;
        left: 10px;
        font-size: ${token.fontSizeSM}px;
        background: ${token.colorBgContainer};
        border-radius: ${token.borderRadius}px;
        box-shadow: ${token.boxShadowTertiary};

        &.warning {
            background: ${token.colorWarning};
            color: ${token.colorWhite};
        }
    `)

    return {photoSize}
})

interface Props {
    size: number
}

const SizeBytesBlock: React.FC<Props> = ({size}) => {
    const {styles} = useStyles()

    return (
        <div className={cn(styles.photoSize, {warning: size > 500})}>
            {bytesToSize(size * 1000)}
        </div>
    )
}

export default SizeBytesBlock