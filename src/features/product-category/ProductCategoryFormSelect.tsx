import React from "react"
import {Form, TreeSelect} from "antd"
import {useGetCategoriesWithSubCategoriesQuery} from "./productCategoryApi"

const CategoryFormSelect: React.FC = () => {
    const {data: categories, isLoading} = useGetCategoriesWithSubCategoriesQuery(
        undefined,
        {refetchOnMountOrArgChange: true}
    )

    const treeData = categories?.map(cat => ({
        title: cat.title,
        value: cat.id,
        selectable: false,
        children: cat.sub_categories?.map(sub => ({
            title: sub.title,
            value: sub.id,
            selectable: false,
            children: sub.sub_categories?.map(third => ({
                title: third.title,
                value: third.id,
                selectable: true
            }))
        }))
    }))

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