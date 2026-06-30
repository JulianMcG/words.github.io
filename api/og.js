import { createElement } from 'react';
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams, origin } = new URL(req.url);
  const emoji = searchParams.get('e') || '';
  const title = searchParams.get('t') || 'Untitled';
  const display = title.length > 55 ? title.slice(0, 55) + '\u2026' : title;

  const graphic = emoji
    ? createElement('div', { style: { fontSize: 160, lineHeight: 1, marginBottom: 32 } }, emoji)
    : createElement('img', {
        src: `${origin}/logolight.png`,
        style: { width: 160, height: 160, objectFit: 'contain', marginBottom: 32 },
      });

  return new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf7f4',
          padding: '60px',
          position: 'relative',
          fontFamily: 'sans-serif',
        },
      },
      graphic,
      createElement(
        'div',
        {
          style: {
            fontSize: display.length > 35 ? 52 : 64,
            fontWeight: 700,
            color: '#1a1a1a',
            textAlign: 'center',
            lineHeight: 1.25,
            maxWidth: '900px',
          },
        },
        display,
      ),
      createElement(
        'div',
        {
          style: {
            position: 'absolute',
            bottom: 48,
            fontSize: 26,
            color: '#c0b8b0',
            letterSpacing: '0.05em',
          },
        },
        'words',
      ),
    ),
    { width: 1200, height: 630 },
  );
}
