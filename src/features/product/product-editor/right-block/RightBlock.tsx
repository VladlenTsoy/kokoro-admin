import {createStyles} from "antd-style"
import ImagesSection from "../../../file-uploader/product-image-uploader/ProductImageUploader.tsx"
import React, {type Dispatch, type SetStateAction} from "react"
import {Alert, Button, Card, Divider, Space, Tag, Typography} from "antd"
import {SaveFilled} from "@ant-design/icons"
import type {ProductTemporaryImageType} from "../../../file-uploader/product-image-uploader/ProductImageUploaderType.ts"

const {Text, Title} = Typography

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
    const activeImagesCount = imageUrls.filter((image) => !image.to_delete && Boolean(image.path || image.url)).length
    const hasActiveImages = activeImagesCount > 0

    return (
        <div className={styles.content}>
            <Card>
                <Space direction="vertical" size={4} style={{width: "100%"}}>
                    <Space wrap align="center" style={{justifyContent: "space-between", width: "100%"}}>
                        <Title level={3} style={{margin: 0}}>Фотографии</Title>
                        <Tag color={hasActiveImages ? "green" : "orange"}>Фото: {activeImagesCount}</Tag>
                    </Space>
                    <Text type="secondary">
                        Главное фото влияет на витрину, поиск и рекламные подборки. Проверьте изображения перед публикацией.
                    </Text>
                    {!hasActiveImages && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Нет активных фото товара"
                            description="Карточку можно сохранить, но перед публикацией добавьте фото, чтобы менеджеры не вывели на витрину пустой товар."
                        />
                    )}
                </Space>
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
