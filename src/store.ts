import {configureStore, combineReducers} from "@reduxjs/toolkit"
import {useDispatch as useStoreDispatch} from "react-redux"

export type StoreState = ReturnType<typeof adminReducer>

export const adminReducer = combineReducers({
    
})

export type AppDispatch = typeof store.dispatch

export interface AppThunkProps {
    dispatch: AppDispatch
    state: StoreState
    extra?: unknown
    rejectValue?: unknown
}

export const useDispatch = () => useStoreDispatch<any>()

export const store = configureStore({
    reducer: adminReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({immutableCheck: false})

})