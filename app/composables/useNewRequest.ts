// Shared state for the "New request" modal, opened from the header, the hero and /new.
export function useNewRequest() {
  const open = useState('newRequestOpen', () => false)
  const seed = useState('newRequestSeed', () => '')
  const lastCreated = useState<string | null>('lastCreatedKey', () => null)

  function openWith(text = '') {
    seed.value = text.trim()
    open.value = true
  }

  return { open, seed, lastCreated, openWith }
}
