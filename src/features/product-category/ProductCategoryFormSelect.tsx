import React from "react"
import {Form, TreeSelect} from "antd"
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
    const {data: categories, isLoading} = useGetCategoriesWithSubCategoriesQuery(
        undefined,
        {refetchOnMountOrArgChange: true}
    )

    const treeData = categories?.map(mapCategoryToTreeNode)

    return (
        <Form.Item
            label="Категория"
            name="category_id"
            rules={[{required: true, message: "Выберите категорию!"}]}
        >
            <TreeSelect
                showSearch
                loading={isLoading}
                treeData={treeData}
                placeholder="Выберите категорию"
                treeDefaultExpandAll
                style={{width: "100%"}}
                treeNodeLabelProp="title"
                filterTreeNode={(input, treeNode) => {
                    const title = (treeNode.title ?? "").toString()
                    return title.toLowerCase().includes(input.toLowerCase())
                }}
            />
        </Form.Item>
    )
}

export default CategoryFormSelect
