import React from "react"
import {createUseStyles} from "react-jss"

const useStyles = createUseStyles({
    status: {
        borderRadius: "50px",
        padding: "0.25rem 1rem",
        textTransform: "uppercase",
        textAlign: "center",
        fontWeight: "500",
        fontSize: "12px",
        overflow: "hidden",

        "&.success": {
            backgroundColor: "rgba(7, 202, 99, 0.2)",
            color: "#07ca63"
        },
        "&.danger": {
            backgroundColor: "rgba(255, 0, 0, 0.3)",
            color: "#f76160"
        },
        "&.warning": {
            backgroundColor: "rgba(250, 173, 20, 0.2)",
            color: "#faad14"
        },
        "&.draft": {
            backgroundColor: "rgba(194, 199, 207, 0.2)",
            color: "#c2c7cf"
        }
    }
})

interface StatusProps {
    status: "draft" | "published" | "archive" | "ending";
}

const Status: React.FC<StatusProps> = ({status}) => {
    const styles = useStyles()
    return (
        <>
            {status === "published" && <div className={styles.status + " success"}>Размещён</div>}
            {status === "archive" && <div className={styles.status + " danger"}>В архиве</div>}
            {status === "draft" && <div className={styles.status + " draft"}>В проекте</div>}
            {status === "ending" && <div className={styles.status + " warning"}>Закончился</div>}
        </>
    )
}

export default Status
