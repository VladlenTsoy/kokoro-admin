import {createStyles} from "antd-style"
import ImagesSection from "../../../file-uploader/product-image-uploader/ProductImageUploader.tsx"
import React, {type Dispatch, type SetStateAction} from "react"
import {Alert, Button, Card, Divider, Space, Typography} from "antd"
import {SaveFilled} from "@ant-design/icons"
import type {ProductTemporaryImageType} from "../../../file-uploader/product-image-uploader/ProductImageUploaderType.ts"

const {Title} = Typography

const useStyles = createStyles(() => ({
    content: {
        position: "sticky",
        top: "1rem"
    }
}))

interface Props {
    imageUrls: ProductTemporaryImageType[];
    setImageUrl: Dispatch<SetStateAction<ProductTemporaryImageType[]>>;
    isSaving?: boolean
    saveDisabled?: boolean
    saveDisabledReason?: string
}

const RightBlock: React.FC<Props> = ({imageUrls, setImageUrl, isSaving, saveDisabled, saveDisabledReason}) => {
    const {styles} = useStyles()

    return (
        <div className={styles.content}>
            <Card>
                <Title level={3}>Фотографии</Title>
                <Divider size="small" />
                <ImagesSection imageUrls={imageUrls} setImageUrl={setImageUrl} />
                <Divider size="middle" />
                <Space orientation="vertical" style={{width: "100%"}}>
                    {saveDisabled && saveDisabledReason && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Сохранение временно недоступно"
                            description={saveDisabledReason}
                        />
                    )}
                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        block
                        form="editor-product"
                        icon={<SaveFilled />}
                        loading={isSaving}
                        disabled={isSaving || saveDisabled}
                    >
                        {isSaving ? "Сохраняем..." : "Сохранить"}
                    </Button>
                </Space>
            </Card>
        </div>
    )
}

export default RightBlock
