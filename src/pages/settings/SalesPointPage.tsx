import React, {useState} from "react"
import {Table, Button, Popconfirm, Modal, Form, Input, InputNumber} from "antd"
import {
    useGetSalesPointsQuery,
    useCreateSalesPointMutation,
    useUpdateSalesPointMutation,
    useDeleteSalesPointMutation
} from "../../features/settings/sales-point/salesPointApi.ts"
import type {SalesPointType} from "../../features/settings/sales-point/SalesPointTypes.ts"

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
        {title: "Title", dataIndex: "title"},
        {title: "Latitude", dataIndex: ["location", "lat"]},
        {title: "Longitude", dataIndex: ["location", "lng"]},
        {
            title: "Actions",
            render: (_: any, record: SalesPointType) => (
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
                        Edit
                    </Button>
                    <Popconfirm title="Delete sales point?" onConfirm={() => deleteSalesPoint(record.id)}>
                        <Button type="link" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </>
            )
        }
    ]

    return (
        <div>
            <Button
                type="primary"
                style={{marginBottom: 16}}
                onClick={() => {
                    setEditingPoint(null)
                    form.resetFields()
                    setIsModalOpen(true)
                }}
            >
                Add Sales Point
            </Button>

            <Table
                loading={isLoading}
                dataSource={data || []}
                columns={columns}
                rowKey="id"
            />

            <Modal
                title={editingPoint ? "Edit Sales Point" : "Add Sales Point"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleSubmit}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="title" label="Title" rules={[{required: true}]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lat" label="Latitude" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} step={0.000001} />
                    </Form.Item>
                    <Form.Item name="lng" label="Longitude" rules={[{required: true}]}>
                        <InputNumber style={{width: "100%"}} step={0.000001} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default SalesPointPage
