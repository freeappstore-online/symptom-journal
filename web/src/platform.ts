import { initApp } from '@freeappstore/sdk'

// Published app identifier; diary data stays in this browser.
// The tracked pnpm SDK patch disables automatic capture and all logger uploads.
export const fas = initApp({ appId: 'symptom-map' })
