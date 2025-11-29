import {Button, Collapse, Divider, Space, Typography} from "antd"
import {useGetProductPropertiesQuery} from "../../features/settings/product-property/productPropertyApi.ts"
import {DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons"

const {Title, Text} = Typography

const ProductPropertyPage = () => {
    const {data} = useGetProductPropertiesQuery({isGlobal: 1}, {refetchOnMountOrArgChange: true})

    const genExtra = () => <Space size="middle">
        <EditOutlined onClick={(event) => {
            event.stopPropagation()
        }} />
        <DeleteOutlined
            onClick={(event) => {
                event.stopPropagation()
            }}
        />
    </Space>

    return (
        <>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <div>
                    <Title level={3} style={{marginBottom: 0}}>Свойства</Title>
                    <Text type="secondary">Добавленное здесь свойство отображается на всех товарах.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />}>Создать свойство</Button>
            </div>
            <Divider size="middle" />
            <Collapse
                size="large"
                items={data?.map(item => ({
                    key: item.id,
                    label: item.title,
                    children: <div dangerouslySetInnerHTML={{__html: item.description}} />,
                    extra: genExtra()
                }))}
            />
        </>
    )
}

export default ProductPropertyPage