import React from "react"

interface ContainerProps {
    padding?: string
    full?: boolean;
    children?: any
}

const Container: React.FC<ContainerProps> = (
    {
        full,
        padding = "2rem 0",
        children
    }
) => {
    return (
        <div>
            <div
                style={{padding: padding}}
            >
                {children}
            </div>
        </div>
    )
}

export default Container