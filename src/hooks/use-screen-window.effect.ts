import {useCallback, useEffect, useMemo, useState} from "react"

export const useScreenWindow = ({breakpoint}: {breakpoint: string}) => {
    const breakpointWidth: any = useMemo(
        () => ({
            xxl: 1600,
            xl: 1200,
            lg: 992,
            md: 768,
            sm: 576,
            xs: 480
        }),
        []
    )

    const updateSize = useCallback(() => {
        if (window.innerWidth >= 1600) return "xxl"
        else if (window.innerWidth >= 1200) return "xl"
        else if (window.innerWidth >= 992) return "lg"
        else if (window.innerWidth >= 768) return "md"
        else if (window.innerWidth >= 576) return "sm"
        // else if (window.innerWidth >= 480)
        else return "xs"
    }, [])

    const [size, setSize] = useState<any>(updateSize())
    const [isBreakpoint, setIsBreakpoint] = useState<boolean>(
        breakpointWidth[breakpoint] >= window.innerWidth
    )

    const updatesBreakpoint = useCallback(() => {
        setIsBreakpoint(breakpointWidth[breakpoint] >= window.innerWidth)
    }, [breakpoint, breakpointWidth])

    useEffect(() => {
        const resizeHandler = () => {
            setSize(updateSize())
            updatesBreakpoint()
        }

        window.addEventListener("resize", resizeHandler)

        return () => {
            window.removeEventListener("resize", resizeHandler)
        }
    }, [updateSize, updatesBreakpoint])

    return [size, isBreakpoint]
}
