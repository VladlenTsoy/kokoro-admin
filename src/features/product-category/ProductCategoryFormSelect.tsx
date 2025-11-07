import React from "react"
import {Form, TreeSelect} from "antd"
import {useGetCategoriesWithSubCategoriesQuery} from "./productCategoryApi"

const CategoryFormSelect: React.FC = () => {
    const {data: categories, isLoading} = useGetCategoriesWithSubCategoriesQuery(
        undefined,
        {refetchOnMountOrArgChange: true}
    )

    // Преобразуем данные под TreeSelect
    const treeData = categories?.map(cat => ({
        title: cat.title,
        value: cat.id,
        selectable: false, // категория не выбирается
        children: cat.sub_categories?.map(sub => ({
            title: sub.title,
            value: sub.id,
            selectable: false, // подкатегория не выбирается
            children: sub.sub_categories?.map(third => ({
                title: third.title,
                value: third.id,
                selectable: true // можно выбрать только последний уровень
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
            />
        </Form.Item>
    )
}

export default CategoryFormSelect