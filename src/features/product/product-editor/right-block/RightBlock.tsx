import {createStyles} from "antd-style"
import ImagesSection, {type TemporaryImageType} from "./image-section/ImagesSection.tsx"
import React, {type Dispatch, type SetStateAction} from "react"

const useStyles = createStyles(() => ({
    content: {
        position: "sticky",
        top: "1rem"
    }
}))

interface Props {
    imageUrls: TemporaryImageType[];
    setImageUrl: Dispatch<SetStateAction<TemporaryImageType[]>>;
}

const RightBlock: React.FC<Props> = ({imageUrls, setImageUrl}) => {
    const {styles} = useStyles()

    return (
        <div className={styles.content}>
            <ImagesSection imageUrls={imageUrls} setImageUrl={setImageUrl} />
        </div>
    )
}

export default RightBlock