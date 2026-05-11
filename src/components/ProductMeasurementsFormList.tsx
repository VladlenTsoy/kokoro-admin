import React from "react"
import {Alert, Button, Empty, Form, Input, Tooltip, Typography} from "antd"
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons"
import {createStyles} from "antd-style"

const useMeasurementsStyles = createStyles(({token, css}) => {
    const measurements = css`
        overflow: hidden;
        width: 100%;
        display: grid;
        gap: 12px;
    `
    const container = css`
        overflow-x: auto;
        margin-bottom: 0.5rem;
        width: 100%;
    `
    const table = css`
        width: 100%;
        min-width: 520px;
        border-collapse: collapse;

        thead {
            th {
                vertical-align: middle;
                text-align: left;
                font-weight: 500;
                font-size: ${token.fontSize}px;
                color: ${token.colorText};
                padding: 0 0.5rem 0.25rem;

                &:first-child {
                    text-align: left;
                    padding-left: 0;
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
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
    `
    const guidance = css`
        display: grid;
        gap: 4px;
    `
    const empty = css`
        border: 1px dashed ${token.colorBorder};
        border-radius: ${token.borderRadiusLG}px;
        padding: 16px;
        background: ${token.colorFillAlter};
    `
    return {
        container,
        measurements,
        action,
        table,
        left,
        title,
        guidance,
        empty
    }
})

interface Props {
    selectedSizes: {id: number; title: string}[];
}

const ProductMeasurementsFormList: React.FC<Props> = ({selectedSizes}) => {
    const {styles} = useMeasurementsStyles()
    const hasSelectedSizes = selectedSizes.length > 0

    return (
        <div className={styles.measurements}>
            <div className={styles.guidance}>
                <Typography.Text type="secondary">
                    Добавьте строки вроде «Длина изделия», «Обхват груди», «Длина рукава» и заполните значения для каждого выбранного размера.
                </Typography.Text>
                <Typography.Text type="secondary">
                    Если размеров ещё нет, сначала выберите размеры выше — так менеджер не сохранит неполную размерную сетку.
                </Typography.Text>
            </div>
            {!hasSelectedSizes && (
                <Alert
                    type="warning"
                    showIcon
                    message="Размеры не выбраны"
                    description="Обмеры появятся в таблице после выбора размеров товара. Это помогает не потерять значения по S/M/L или другим вариантам."
                />
            )}
            <Form.List name="measurements">
                {(fields, {add, remove}) => (
                    <>
                        {fields.length === 0 ? (
                            <div className={styles.empty}>
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        hasSelectedSizes
                                            ? "Пока нет строк обмеров. Добавьте первый параметр, чтобы покупатель видел размерную сетку."
                                            : "Выберите размеры товара, затем добавьте строки обмеров."
                                    }
                                />
                            </div>
                        ) : (
                            <div className={styles.container} aria-label="Таблица обмеров товара">
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th className={styles.left}>Параметр обмера</th>
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
                                                        rules={[{required: true, message: "Введите название параметра"}]}
                                                    >
                                                        <Input placeholder="Например: длина изделия" style={{minWidth: "170px"}} />
                                                    </Form.Item>
                                                    <Tooltip title="Удалить строку обмера для всех размеров">
                                                        <MinusCircleOutlined
                                                            role="button"
                                                            aria-label="Удалить строку обмера"
                                                            onClick={() => remove(field.name)}
                                                        />
                                                    </Tooltip>
                                                </div>
                                            </td>
                                            {selectedSizes.map((sizes) => (
                                                <td key={`td-desc-${field.key}-${sizes.id}`}>
                                                    <Form.Item
                                                        {...field}
                                                        name={[field.name, "descriptions", String(sizes.id)]}
                                                        rules={[{required: true, message: "Введите значение для размера"}]}
                                                        key={`descriptions-${field.key}`}
                                                    >
                                                        <Input.TextArea
                                                            placeholder="Например: 62 см" rows={1}
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
                        )}
                        <div className={styles.action}>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                size="large"
                                onClick={() => add()}
                                disabled={!hasSelectedSizes}
                            >
                                Добавить строку обмера
                            </Button>
                            {!hasSelectedSizes && (
                                <Typography.Text type="secondary">
                                    Кнопка станет доступна после выбора размеров товара.
                                </Typography.Text>
                            )}
                        </div>
                    </>
                )}
            </Form.List>
        </div>
    )
}

export default ProductMeasurementsFormList
