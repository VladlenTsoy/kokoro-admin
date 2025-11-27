import {createStyles} from "antd-style"

const useStyles = createStyles(({token, css}) => ({
    fillGrey: css`
        fill: #535964;
        transition: fill 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            fill: ${token.colorPrimary};
        }
    `,

    fillWhite: css`
        fill: #fff;
        transition: fill 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            fill: #535964;
        }
    `,

    strokeWhite: css`
        stroke: #fff;
        transition: stroke 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            stroke: #535964;
        }
    `
}))

const ProductQtyIcon = () => {
    const {styles} = useStyles()

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.9306 2.48L4.59061 5.45003C3.38061 6.12003 2.39062 7.80001 2.39062 9.18001V14.83C2.39062 16.21 3.38061 17.89 4.59061 18.56L9.9306 21.53C11.0706 22.16 12.9406 22.16 14.0806 21.53L19.4206 18.56C20.6306 17.89 21.6206 16.21 21.6206 14.83V9.18001C21.6206 7.80001 20.6306 6.12003 19.4206 5.45003L14.0806 2.48C12.9306 1.84 11.0706 1.84 9.9306 2.48Z" className={styles.fillGrey} />
            <path d="M3.16992 7.44L11.9999 12.55L20.7699 7.46997" className={styles.strokeWhite} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 21.61V12.54" className={styles.strokeWhite} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16.9998 13.24V9.58002L7.50977 4.09998" className={styles.strokeWhite} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default ProductQtyIcon