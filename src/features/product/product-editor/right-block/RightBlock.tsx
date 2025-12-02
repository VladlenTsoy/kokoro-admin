import {createStyles} from "antd-style"
import ImagesSection, {type TemporaryImageType} from "./image-section/ImagesSection.tsx"
import React, {type Dispatch, type SetStateAction} from "react"
import {Button, Card, Divider, Space, Typography} from "antd"
import {SaveFilled} from "@ant-design/icons"

const {Title} = Typography

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
            <Card>
                <Title level={3}>Фотографии</Title>
                <Divider size="small" />
                <ImagesSection imageUrls={imageUrls} setImageUrl={setImageUrl} />
                <Divider size="middle" />
                <Space direction="vertical" style={{width: "100%"}}>
                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        block
                        form="editor-product"
                        icon={<SaveFilled />}
                    >
                        Сохранить
                    </Button>
                </Space>
            </Card>
        </div>
    )
}

export default RightBlock