import React from "react"
import {Button, Card, Divider, Form, Input, Typography} from "antd"
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useMeasurementsStyles = createStyles(({token, css}) => {
    const measurements = css`
        overflow: hidden;

        .container {
            overflow-x: auto;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;
            width: 100%;
        }

        .table {
            width: 100%;
            border-collapse: collapse;

            thead {
                th {
                    vertical-align: middle;
                    text-align: left;
                    font-weight: 500;
                    font-size: ${token.fontSize}px;
                    color: ${token.colorText};
                    padding: 0;

                    &:first-child {
                        padding-left: 1rem;
                        text-align: left;
                    }

                    &:last-child {
                        padding-right: 1rem;
                    }

                    &.left {
                        text-align: left;
                    }
                }
            }

            tbody {
                tr:first-child td {
                    padding-top: .5rem;
                }

                td {
                    padding: .25rem 0.5rem;
                    vertical-align: middle;
                    text-align: center;

                    &:first-child {
                        padding-left: 1rem;
                        text-align: left;
                    }

                    &:last-child {
                        padding-right: 1rem;
                    }

                    .title {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    /* Antd form item global adjustments inside table cells */

                    .ant-form-item {
                        margin-bottom: 0;
                    }

                    /* specific rules for the icon inside .title */

                    .title .anticon {
                        transition: color 0.3s ease-in-out;
                        font-size: 20px;
                        color: ${token.colorTextSecondary};

                        &:hover {
                            color: ${token.colorError};
                        }
                    }
                }
            }
        }

        .action {
            padding: 0 1rem 1rem;
        }
    `

    return {
        measurements
    }
})


const {Title} = Typography

interface MeasurementsSectionProps {
    selectedSizes: {id: number; title: string}[];
}

const MeasurementsSection: React.FC<MeasurementsSectionProps> = ({selectedSizes}) => {
    const {styles} = useMeasurementsStyles()

    return (
        <Card>
            <Title level={3}>Обмеры</Title>
            <Divider size="small" />
            <div className={styles.measurements}>
                <Form.List name="measurements">
                    {(fields, {add, remove}) => (
                        <>
                            <div className="container">
                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th className="left">Размеры</th>
                                        {selectedSizes.map((size) => (
                                            <th key={`tr-size-${size.id}`}>{size.title}</th>
                                        ))}
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {fields.map((field) => (
                                        <tr key={`tr-size-${field.key}`}>
                                            <td key={`td-title-${field.key}`}>
                                                <div className="title">
                                                    <Form.Item
                                                        hidden
                                                        {...field}
                                                        name={[field.name, "id"]}
                                                        fieldKey={[field.key, "id"]}
                                                        key={`id-${field.key}`}
                                                    >
                                                        <Input />
                                                    </Form.Item>

                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, "title"]}
                                                        fieldKey={[field.key, "title"]}
                                                        key={`id-title-${field.key}`}
                                                        rules={[{required: true, message: "Введите название!"}]}
                                                    >
                                                        <Input placeholder="Название" style={{minWidth: "150px"}} />
                                                    </Form.Item>

                                                    <MinusCircleOutlined onClick={() => remove(field.name)} />
                                                </div>
                                            </td>

                                            {selectedSizes.map((sizes) => (
                                                <td key={`td-desc-${field.key}-${sizes.id}`}>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, "descriptions", String(sizes.id)]}
                                                        fieldKey={[field.key, "descriptions", String(sizes.id)]}
                                                        rules={[{required: true, message: "Введите описание!"}]}
                                                    >
                                                        <Input.TextArea placeholder="Описание" rows={1}
                                                                        style={{minWidth: "150px"}} />
                                                    </Form.Item>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="action">
                                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => add()}>
                                    Добавить
                                </Button>
                            </div>
                        </>
                    )}
                </Form.List>
            </div>
        </Card>
    )
}

export default MeasurementsSection