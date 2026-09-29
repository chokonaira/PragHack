/** Example chips for the creator. The first three samples from docs/ai-samples.md, with short labels. */
export interface ExampleRequest {
  label: string
  text: string
}

export const exampleRequests: ExampleRequest[] = [
  {
    label: 'Laptop keeps shutting down',
    text: 'My laptop keeps shutting down since yesterday\'s update. It happened three times this morning and I can\'t work properly.'
  },
  {
    label: 'Kiosk access for a new hire',
    text: 'I need access to the new kiosk for a new employee starting Monday.'
  },
  {
    label: 'Card terminal not working',
    text: 'The point of sale terminal at Prague Nusle is not accepting cards.'
  }
]
