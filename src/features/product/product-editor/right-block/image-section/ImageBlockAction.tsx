import React from "react"
import {Button} from "antd"
import {ArrowLeftOutlined, ArrowRightOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"
import type {TemporaryImageType} from "./ImagesSection.tsx"

const useStyles = createStyles(({css, cx}) => {
    const actions = cx(css`
        .actions {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            transform: translateY(100%);
            transition: all 0.2s ease-in-out;
            z-index: 5;
            opacity: 0;
            display: flex;
            gap: 0.5rem;
            align-items: center;
            justify-content: center;

            .ant-btn {
                border: 0;
            }
        }
    `)

    return {actions}
})


interface Props {
    image: TemporaryImageType
    nextHandler?: (id: number) => void
    prevHandler?: (id: number) => void
}

const ImageBlockAction: React.FC<Props> = ({image, prevHandler, nextHandler}) => {
    const {styles} = useStyles()

    return (
        <div className={styles.actions}>
            <div className="actions">
                <Button onClick={() => prevHandler?.(image.id)} shape="circle">
                    <ArrowLeftOutlined />
                </Button>
                <Button onClick={() => nextHandler?.(image.id)} shape="circle">
                    <ArrowRightOutlined />
                </Button>
            </div>
        </div>
    )
}

export default ImageBlockAction