import { createToastStore } from './toast-store'

const store = createToastStore()

export const toasts = { subscribe: store.subscribe }
export const showToast = store.show
export const dismissToast = store.dismiss
