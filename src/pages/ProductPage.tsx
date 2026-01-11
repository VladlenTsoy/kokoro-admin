import ProductEditor from "../features/product/product-editor/ProductEditor.tsx"
import {useParams} from "react-router-dom"

const ProductPage = () => {
    const {id, variantId} = useParams<{id: string, variantId: string}>()

    return (
        <>
            <ProductEditor productId={id || variantId} isColor={!!variantId} key={id || "create"} />
        </>
    )
}

export default ProductPage