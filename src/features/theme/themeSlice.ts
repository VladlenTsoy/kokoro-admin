import {createSlice, type PayloadAction} from "@reduxjs/toolkit"
import {useSelector} from "react-redux"
import type {StoreState} from "../store.ts"

interface ThemeState {
    mode: "light" | "dark"
}

const initialState: ThemeState = {
    mode: "dark"
}

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        changeThemeMode: (state, action: PayloadAction<ThemeState["mode"]>) => {
            state.mode = action.payload
        }
    }
})

export default themeSlice.reducer

export const {changeThemeMode} = themeSlice.actions

export const useSelectedTheme = () => {
    return useSelector((state: StoreState) => state.theme.mode)
}