import { initApp } from '@freeappstore/sdk'

// Local identifier; hosting and repository provisioning have not been configured.
// The tracked pnpm SDK patch disables automatic capture and all logger uploads.
export const fas = initApp({ appId: 'symptom-map' })
