"use client"

// Thin re-export so every call site imports from one place. No-ops on
// desktop/unsupported devices - see https://haptics.lochie.me/.
export { useWebHaptics as useHaptics } from "web-haptics/react"
