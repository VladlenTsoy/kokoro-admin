import React from "react"
import {Button, Form, Input} from "antd"
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useMeasurementsStyles = createStyles(({token, css}) => {
    const measurements = css`
        overflow: hidden;
        width: 100%;
        display: grid;
    `
    const container = css`
        overflow-x: auto;
        margin-bottom: 0.5rem;
        width: 100%;
    `
    const table = css`
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
                    text-align: left;
                    padding-left: 0;
                }

                &:last-child {
                    padding-right: 0;
                }

                .ant-form-item {
                    margin-bottom: 0;
                }
            }
        }
    `
    const title = css`
        display: flex;
        align-items: center;
        gap: 8px;

        & .anticon {
            transition: color 0.3s ease-in-out;
            font-size: 20px;
            color: ${token.colorTextSecondary};

            &:hover {
                color: ${token.colorError};
            }
        }
    `
    const left = css`
        text-align: left;
    `
    const action = css`
        padding: 0 0 1rem;
    `
    return {
        container,
        measurements,
        action,
        table,
        left,
        title
    }
})

interface Props {
    selectedSizes: {id: number; title: string}[];
}

const ProductMeasurementsFormList: React.FC<Props> = ({selectedSizes}) => {
    const {styles} = useMeasurementsStyles()

    return (
        <div className={styles.measurements}>
            <Form.List name="measurements">
                {(fields, {add, remove}) => (
                    <>
                        <div className={styles.container}>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th className={styles.left}>Размеры</th>
                                    {selectedSizes.map((size) => (
                                        <th key={`tr-size-${size.id}`}>{size.title}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {fields.map((field) => (
                                    <tr key={`tr-size-${field.key}`}>
                                        <td key={`td-title-${field.key}`}>
                                            <div className={styles.title}>
                                                <Form.Item
                                                    hidden
                                                    {...field}
                                                    name={[field.name, "id"]}
                                                    key={`id-${field.key}`}
                                                >
                                                    <Input />
                                                </Form.Item>
                                                <Form.Item
                                                    {...field}
                                                    name={[field.name, "title"]}
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
                                                    rules={[{required: true, message: "Введите описание!"}]}
                                                    key={`descriptions-${field.key}`}
                                                >
                                                    <Input.TextArea
                                                        placeholder="Описание" rows={1}
                                                        style={{minWidth: "150px"}}
                                                    />
                                                </Form.Item>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.action}>
                            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => add()}>
                                Добавить
                            </Button>
                        </div>
                    </>
                )}
            </Form.List>
        </div>
    )
}

export default ProductMeasurementsFormList