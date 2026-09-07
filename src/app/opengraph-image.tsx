import { ImageResponse } from 'next/og'

export const alt = 'Grub - Plan meals together, buy one shop, split it fairly.'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1B4332',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: '#D4A574',
            fontSize: 120,
            fontWeight: 'bold',
            marginBottom: 20,
            fontFamily: 'serif',
          }}
        >
          Grub
        </div>
        <div
          style={{
            color: '#FAFAF7',
            fontSize: 40,
            fontFamily: 'sans-serif',
          }}
        >
          Plan meals together, buy one shop, split it fairly.
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
