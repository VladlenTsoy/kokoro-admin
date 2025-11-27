import {createStyles} from "antd-style"

const useStyles = createStyles(({ token, css }) => ({
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
}));

const ProductInfoIcon = () => {
    const {styles} = useStyles()

    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14"
                className={styles.fillGrey}
            />
            <path
                d="M22 10H18C15 10 14 9 14 6V2L22 10Z"
                className={styles.fillWhite}
            />
            <path
                d="M7 13H13"
                className={styles.strokeWhite}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7 17H11"
                className={styles.strokeWhite}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default ProductInfoIcon
