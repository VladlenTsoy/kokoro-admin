import ProductEditor from "../features/product/product-editor/ProductEditor.tsx"
import {useParams} from "react-router-dom"

const ProductPage = () => {
    const {id} = useParams<{id: string}>()

    return (
        <>
            <ProductEditor productId={id} />
        </>
    )
}

export default ProductPage