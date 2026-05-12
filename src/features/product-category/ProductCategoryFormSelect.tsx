import React from "react"
import {AppstoreOutlined, ReloadOutlined} from "@ant-design/icons"
import {Alert, Button, Form, Space, TreeSelect, Typography} from "antd"
import {useGetCategoriesWithSubCategoriesQuery} from "./productCategoryApi"
import type {ProductCategoryWithSubCategoryType} from "./ProductCategoryTypes.ts"

interface CategoryTreeNode {
    title: string
    value: number
    selectable: boolean
    children: CategoryTreeNode[]
}

function mapCategoryToTreeNode(category: ProductCategoryWithSubCategoryType): CategoryTreeNode {
    const children = category.sub_categories?.map(mapCategoryToTreeNode) ?? []

    return {
        title: category.title,
        value: category.id,
        selectable: children.length === 0,
        children
    }
}

const CategoryFormSelect: React.FC = () => {
    const {data: categories, isError, isFetching, isLoading, refetch} = useGetCategoriesWithSubCategoriesQuery(
        undefined,
        {refetchOnMountOrArgChange: true}
    )
    const hasLoadedCategories = (categories?.length ?? 0) > 0

    const treeData = categories?.map(mapCategoryToTreeNode)

    return (
        <>
            <Form.Item
                label="Категория"
                name="category_id"
                extra="Категория влияет на витрину, навигацию каталога и поиск товара покупателями."
                rules={[{required: true, message: "Выберите категорию!"}]}
            >
                <TreeSelect
                    showSearch
                    loading={isLoading || isFetching}
                    treeData={treeData}
                    placeholder={isError ? "Не удалось загрузить категории" : "Выберите категорию"}
                    treeDefaultExpandAll
                    style={{width: "100%"}}
                    treeNodeLabelProp="title"
                    disabled={isError && !hasLoadedCategories}
                    notFoundContent={(
                        <Space direction="vertical" size={4} style={{padding: "8px 0"}}>
                            <Typography.Text type="secondary">Категории не найдены</Typography.Text>
                            <Typography.Text type="secondary" style={{fontSize: 12}}>
                                Настройте дерево каталога перед публикацией карточки товара.
                            </Typography.Text>
                        </Space>
                    )}
                    filterTreeNode={(input, treeNode) => {
                        const title = (treeNode.title ?? "").toString()
                        return title.toLowerCase().includes(input.toLowerCase())
                    }}
                />
            </Form.Item>
            {isError && (
                <Alert
                    type="warning"
                    showIcon
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Категории временно недоступны"
                    description="Не публикуйте карточку, пока менеджер не видит актуальную категорию: товар может попасть не в тот раздел витрины или потеряться в навигации. Повторите загрузку перед сохранением."
                    action={(
                        <Button size="small" icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>
                            Повторить
                        </Button>
                    )}
                />
            )}
            {!isLoading && !isError && !hasLoadedCategories && (
                <Alert
                    type="info"
                    showIcon
                    icon={<AppstoreOutlined />}
                    style={{marginTop: -12, marginBottom: 20}}
                    message="Категории каталога ещё не настроены"
                    description="Создайте категории в настройках каталога, чтобы менеджеры могли сохранить товар в правильный раздел витрины и не публиковали карточки без навигации."
                />
            )}
        </>
    )
}

export default CategoryFormSelect
