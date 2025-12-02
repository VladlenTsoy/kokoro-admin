import {useGetProductPropertiesQuery} from "./productPropertyApi.ts"
import {Button, Checkbox, Col, Form, Popover, Row, Skeleton} from "antd"
import {createStyles} from "antd-style"
import {PlusOutlined, QuestionCircleFilled} from "@ant-design/icons"
import DOMPurify from "dompurify"

const useStyles = createStyles(({token}) => ({
    groupCheckbox: {
        width: "100%",
        marginTop: 24,
        marginBottom: ".75rem"
    },
    labelCheckbox: {
        display: "block",
        background: "#F8F9F9",
        padding: "1rem",
        borderRadius: token.borderRadius,
        cursor: "pointer"
    }
}))

const ProductPropertyFormCheckbox = () => {
    const {styles} = useStyles()
    const {data, isLoading} = useGetProductPropertiesQuery({isGlobal: 1}, {refetchOnMountOrArgChange: true})

    if (isLoading)
        return <Row gutter={[0, 12]} style={{marginTop: 16}}>
            {Array(8).fill(null).map((_, key) =>
                <Col span={6} key={key}>
                    <Skeleton.Input />
                </Col>
            )}
        </Row>

    return (
        <Form.Item name="productProperties">
            <Checkbox.Group className={styles.groupCheckbox}>
                <Row gutter={[12, 12]}>
                    {data?.map((item) =>
                        <Col span={12} key={item.id}>
                            <label className={styles.labelCheckbox}>
                                <Checkbox value={item.id}>
                                    {item.title}
                                    <Popover
                                        content={
                                            <div
                                                style={{maxWidth: 200}}
                                                dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(item.description)}}
                                            />
                                        }
                                    >
                                        <QuestionCircleFilled style={{marginLeft: 6}} />
                                    </Popover>
                                </Checkbox>
                            </label>
                        </Col>
                    )}
                </Row>
            </Checkbox.Group>
            <Button type="primary" icon={<PlusOutlined />}>Добавить свойства</Button>
        </Form.Item>
    )
}

export default ProductPropertyFormCheckbox