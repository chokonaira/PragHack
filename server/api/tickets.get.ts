// First slice of T-05: serves demo tickets so the UI can be built. T-05 adds live mode.
export default defineEventHandler(() => demoProvider.list())
