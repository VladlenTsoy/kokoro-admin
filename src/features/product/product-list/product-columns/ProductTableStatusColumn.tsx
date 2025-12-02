import React, {useMemo} from "react"
import type {ProductType} from "../../ProductType.ts"
import ProductStatusOne from "../../../../components/icons/ProductStatusOne.tsx"
import ProductStatusTwo from "../../../../components/icons/ProductStatusTwo.tsx"
import ProductStatusThree from "../../../../components/icons/ProductStatusThree.tsx"
import ProductStatusFour from "../../../../components/icons/ProductStatusFour.tsx"
import {createStyles} from "antd-style"

const useStyles = createStyles(() => ({
    container: {
        display: "flex",
        alignItems: "center",
        gap: "6px"
    }
}))

interface Props {
    status: ProductType["status"]
}

const ProductTableStatusColumn: React.FC<Props> = ({status}) => {
    const {styles} = useStyles()

    const selectIcon = useMemo(() => {
        switch (status.id) {
            case 1:
                return <ProductStatusThree />
            case 2:
                return <ProductStatusTwo />
            case 3:
                return <ProductStatusOne />
            default:
                return <ProductStatusFour />
        }
    }, [status])

    return (
        <div className={styles.container}>
            {selectIcon}
            {status.title}
        </div>
    )
}

export default ProductTableStatusColumn