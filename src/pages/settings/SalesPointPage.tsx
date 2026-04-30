import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber} from "antd"
import {
    useGetSalesPointsQuery,
    useCreateSalesPointMutation,
    useUpdateSalesPointMutation,
    useDeleteSalesPointMutation
} from "../../features/settings/sales-point/salesPointApi.ts"
import type {SalesPointType} from "../../features/settings/sales-point/SalesPointTypes.ts"
import SettingsTableSection from "../../components/settings/SettingsTableSection.tsx"

const SalesPointPage: React.FC = () => {
    const {data, isLoading} = useGetSalesPointsQuery()
    const [createSalesPoint] = useCreateSalesPointMutation()
    const [updateSalesPoint] = useUpdateSalesPointMutation()
    const [deleteSalesPoint] = useDeleteSalesPointMutation()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingPoint, setEditingPoint] = useState<SalesPointType | null>(null)

    const [form] = Form.useForm()

    const handleSubmit = async () => {
        const values = await form.validateFields()
        const body = {
            title: values.title,
            location: {
                lat: values.lat,
                lng: values.lng
            }
        }
        if (editingPoint) {
            await updateSalesPoint({id: editingPoint.id, body})
        } else {
            await createSalesPoint(body)
        }
        setIsModalOpen(false)
        setEditingPoint(null)
        form.resetFields()
    }

    const columns = [
        {title: "ID", dataIndex: "id"},
        {title: "Название", dataIndex: "title"},
        {title: "Широта", dataIndex: ["location", "lat"]},
        {title: "Долгота", dataIndex: ["location", "lng"]},
        {
            title: "Действия",
            render: (_: unknown, record: SalesPointType) => (
                <>
                    <Button
                        type="link"
                        onClick={() => {
                            setEditingPoint(record)
                            form.setFieldsValue({
                                title: record.title,
                                lat: record.location.lat,
                                lng: record.location.lng
                            })
                            setIsModalOpen(true)
                        }}
                    >
                        Редактировать
                    </Button>
                    <Popconfirm title="Удалить точку продаж?" onConfirm={() => deleteSalesPoint(record.id)}>
                        <Button type="link" danger>
                            Удалить
                        </Button>
                    </Popconfirm>
                </>
            )
        }
    ]

    return (
        <div>
            <SettingsTableSection
                title="Точки продаж"
                subtitle="Управление филиалами и их геопозицией."
                addButtonText="Добавить точку продаж"
                onAdd={() => {
                    setEditingPoint(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                <Table
                    loading={isLoading}
                    dataSource={data || []}
                    columns={columns}
                    rowKey="id"
                />
            </SettingsTableSection>

            <Modal
                title={editingPoint ? "Редактирование точки продаж" : "Создание точки продаж"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Название" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lat" label="Широта" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} step={0.000001} />
                    </Form.Item>
                    <Form.Item name="lng" label="Долгота" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} step={0.000001} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SalesPointPage
