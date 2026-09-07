import { compressImageFile } from '../imageCompression';

describe('compressImageFile', () => {
  it('returns small or non-browser files without crashing', async () => {
    const file = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
    const result = await compressImageFile(file);
    expect(result).toBe(file);
  });

  it('skips compression for SVG files', async () => {
    const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
    const result = await compressImageFile(svgFile);
    expect(result).toBe(svgFile);
  });
});
