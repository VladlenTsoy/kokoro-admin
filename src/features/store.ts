import {configureStore} from "@reduxjs/toolkit"
import {persistCombineReducers, persistStore} from "redux-persist"
import {useDispatch as useDefaultDispatch} from "react-redux"
import storage from "redux-persist/lib/storage"
import auth from "./auth/authSlice.ts"
import {countriesApi} from "./settings/country/countryApi.ts"
import {colorApi} from "./settings/color/colorApi.ts"
import {sizeApi} from "./settings/size/sizeApi.ts"
import {productCategoryApi} from "./product-category/productCategoryApi.ts"
import {salesPointApi} from "./settings/sales-point/salesPointApi.ts"
import {sourceApi} from "./source/sourceApi.ts"
import {productStorageApi} from "./settings/product-storage/productStorageApi.ts"
import {productVariantTagApi} from "./product-variant-tags/productVariantTagApi.ts"
import {fileUploaderApi} from "./file-uploader/fileUploaderApi.ts"

const persistConfig = {
    key: "root",
    storage
}

const persistedCombineReducers = persistCombineReducers(persistConfig, {
    auth,
    [countriesApi.reducerPath]: countriesApi.reducer,
    [colorApi.reducerPath]: colorApi.reducer,
    [sizeApi.reducerPath]: sizeApi.reducer,
    [productCategoryApi.reducerPath]: productCategoryApi.reducer,
    [salesPointApi.reducerPath]: salesPointApi.reducer,
    [sourceApi.reducerPath]: sourceApi.reducer,
    [productStorageApi.reducerPath]: productStorageApi.reducer,
    [productVariantTagApi.reducerPath]: productVariantTagApi.reducer,
    [fileUploaderApi.reducerPath]: fileUploaderApi.reducer,
})

export const store = configureStore({
    reducer: persistedCombineReducers,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false
        }).concat(countriesApi.middleware)
            .concat(colorApi.middleware)
            .concat(sizeApi.middleware)
            .concat(productCategoryApi.middleware)
            .concat(salesPointApi.middleware)
            .concat(sourceApi.middleware)
            .concat(productStorageApi.middleware)
            .concat(productVariantTagApi.middleware)
            .concat(fileUploaderApi.middleware)
})

export const persistor = persistStore(store)

export type StoreState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export interface ThunkProps {
    dispatch: AppDispatch
    state: StoreState
    extra?: unknown
    rejectValue?: unknown
}

export const useDispatch = () => useDefaultDispatch<AppDispatch>()