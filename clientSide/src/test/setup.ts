// Adds DOM matchers like toBeInTheDocument() and toHaveValue() to expect()
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Remove whatever the last test rendered, so every test starts with an empty page
afterEach(() => {
  cleanup()
})
