import {createStyles} from "antd-style"

const useStyles = createStyles(({token, css}) => ({
    fillGrey: css`
        fill: #535964;
        transition: fill 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            fill: ${token.colorPrimary};
        }
    `,

    fillWhiteOne: css`
        fill: #CFD1D5;
        transition: fill 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            fill: #91959C;
        }
    `,

    fillWhiteTwo: css`
        fill: #91959C;
        transition: fill 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            fill: #CFD1D5;
        }
    `,

    fillWhiteThree: css`
        fill: #fff;
        transition: fill 0.3s ease, stroke 0.3s ease;

        .active &, .menu-item:hover & {
            fill: #535964;
        }
    `,

}))


const ProductMeasurementsIcon = () => {
    const {styles} = useStyles()

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" className={styles.fillGrey} />
            <path d="M13.2 14.4001C13.2 15.4601 12.74 16.4201 12 17.0801C11.36 17.6601 10.52 18.0001 9.59998 18.0001C7.60998 18.0001 6 16.3901 6 14.4001C6 12.7401 7.13002 11.3401 8.65002 10.9301C9.06002 11.9701 9.94999 12.7801 11.05 13.0801C11.35 13.1601 11.67 13.2101 12 13.2101C12.33 13.2101 12.65 13.1701 12.95 13.0801C13.11 13.4801 13.2 13.9301 13.2 14.4001Z" className={styles.fillWhiteOne} />
            <path d="M15.6003 9.6C15.6003 10.07 15.5103 10.52 15.3503 10.93C14.9403 11.97 14.0504 12.78 12.9504 13.08C12.6504 13.16 12.3304 13.21 12.0004 13.21C11.6704 13.21 11.3504 13.17 11.0504 13.08C9.95035 12.78 9.06039 11.98 8.65039 10.93C8.49039 10.52 8.40039 10.07 8.40039 9.6C8.40039 7.61 10.0104 6 12.0004 6C13.9904 6 15.6003 7.61 15.6003 9.6Z" className={styles.fillWhiteTwo} />
            <path d="M18 14.4C18 16.39 16.39 18 14.4 18C13.48 18 12.64 17.65 12 17.08C12.74 16.43 13.2 15.47 13.2 14.4C13.2 13.93 13.11 13.48 12.95 13.07C14.05 12.77 14.94 11.97 15.35 10.92C16.87 11.34 18 12.74 18 14.4Z" className={styles.fillWhiteThree} />
        </svg>
    )
}

export default ProductMeasurementsIcon