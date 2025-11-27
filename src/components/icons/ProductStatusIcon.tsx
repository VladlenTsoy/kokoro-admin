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

const ProductStatusIcon = () => {
    const {styles} = useStyles()

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                  className={styles.fillGrey} />
            <path d="M12.3711 8.88H17.6211" className={styles.strokeWhite} strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" />
            <path d="M6.37891 8.88L7.12891 9.63L9.37891 7.38" className={styles.strokeWhite} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12.3711 15.88H17.6211" className={styles.strokeWhite} strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" />
            <path d="M6.37891 15.88L7.12891 16.63L9.37891 14.38" className={styles.strokeWhite} strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default ProductStatusIcon