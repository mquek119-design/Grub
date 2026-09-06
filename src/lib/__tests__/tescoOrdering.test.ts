import { isTescoOrderingEnabled } from '@/lib/tescoOrdering';

describe('isTescoOrderingEnabled', () => {
  it('enables ordering by default in development', () => {
    expect(isTescoOrderingEnabled({ NODE_ENV: 'development', TESCO_ORDERING_ENABLED: undefined }))
      .toBe(true);
  });

  it('disables ordering by default in production', () => {
    expect(isTescoOrderingEnabled({ NODE_ENV: 'production', TESCO_ORDERING_ENABLED: undefined }))
      .toBe(false);
  });

  it('honours an explicit production opt-in', () => {
    expect(isTescoOrderingEnabled({ NODE_ENV: 'production', TESCO_ORDERING_ENABLED: 'true' }))
      .toBe(true);
  });

  it('honours an explicit local opt-out', () => {
    expect(isTescoOrderingEnabled({ NODE_ENV: 'development', TESCO_ORDERING_ENABLED: 'false' }))
      .toBe(false);
  });
});
