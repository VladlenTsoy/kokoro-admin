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

const ProductPriceIcon = () => {
    const {styles} = useStyles()

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H15C20 2 22 4 22 9V15C22 20 20 22 15 22Z"
                  className={styles.fillGrey} />
            <path
                d="M8.67188 14.3298C8.67188 15.6198 9.66188 16.6598 10.8919 16.6598H13.4019C14.4719 16.6598 15.3419 15.7498 15.3419 14.6298C15.3419 13.4098 14.8119 12.9798 14.0219 12.6998L9.99187 11.2998C9.20187 11.0198 8.67188 10.5898 8.67188 9.36984C8.67188 8.24984 9.54187 7.33984 10.6119 7.33984H13.1219C14.3519 7.33984 15.3419 8.37984 15.3419 9.66984"
                className={styles.strokeWhite} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 6V18" className={styles.strokeWhite} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default ProductPriceIcon