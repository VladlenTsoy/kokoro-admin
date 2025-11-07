import {createSlice} from "@reduxjs/toolkit"
import type {StoreState} from "../store.ts"
import {useSelector} from "react-redux"

interface AuthState {
    token?: string | null
    tokenExpiredDate: number | null
}

const initialState: AuthState = {
    token: "ttt",
    tokenExpiredDate: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthData: (state) => {
            state.token = null
            state.tokenExpiredDate = null
        }
    }
})

export default authSlice.reducer

export const useSelectedAuthData = () => {
    return useSelector((state: StoreState) => state.auth)
}