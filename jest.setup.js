// Jest setup file for global test configuration
import '@testing-library/jest-dom'

// Mock Next.js utilities that may be used in tests
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
}))

// Provide useActionState polyfill in Jest test environment
const React = require('react');
if (!React.useActionState) {
  React.useActionState = (action, initialState) => [initialState, action, false];
}

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
