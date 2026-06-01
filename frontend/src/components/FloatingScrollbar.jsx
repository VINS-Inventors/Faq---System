import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function FloatingScrollbar() {
  const [visible, setVisible] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(40);
  const [thumbTop, setThumbTop] = useState(0);
  const hideTimer = useRef(null);

  const updateThumb = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPct = docHeight > 0 ? scrollTop / docHeight : 0;

    // Thumb size scales inversely with document length
    const minThumb = 36;
    const maxThumb = 120;
    const tall = Math.max(minThumb, Math.min(maxThumb, (window.innerHeight / docHeight) * window.innerHeight));
    setThumbHeight(tall);

    // Thumb position maps to scroll progress
    const trackHeight = window.innerHeight - tall - 16; // 8px padding top+bottom
    setThumbTop(8 + scrollPct * trackHeight);
  }, []);

  const showScrollbar = useCallback(() => {
    setVisible(true);
    updateThumb();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 1400);
  }, [updateThumb]);

  useEffect(() => {
    const onScroll = () => {
      showScrollbar();
      updateThumb();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateThumb, { passive: true });

    // Init thumb size on mount
    updateThumb();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateThumb);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showScrollbar, updateThumb]);

  return (
    <>
      {/* Custom scrollbar track (invisible) + thumb */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 20,
          height: '100vh',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'flex-end',
          paddingRight: 3,
        }}
      >
        {/* Fade wrapper */}
        <div
          style={{
            width: 5,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            opacity: visible ? 1 : 0,
            transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Thumb pill */}
          <div
            style={{
              width: 5,
              height: thumbHeight,
              background: 'rgba(153, 255, 0, 0.35)',
              borderRadius: 10,
              marginTop: thumbTop,
              backdropFilter: 'blur(0px)',
              boxShadow: '0 0 8px rgba(0,0,0,0.3), 0 0 1px rgba(153,255,0,0.15)',
              transition: 'height 80ms ease, margin-top 80ms ease, background 250ms ease',
              willChange: 'transform, height, margin-top',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(153, 255, 0, 0.85)';
              e.currentTarget.style.width = '5px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(153, 255, 0, 0.35)';
            }}
          />
        </div>
      </div>

      {/* Global style overrides for native scrollbars */}
      <style>{`
        /* Hide native scrollbar across the app */
        ::-webkit-scrollbar { display: none !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }

        /* But re-enable it for select / input elements */
        select, input, textarea {
          scrollbar-width: thin !important;
          -ms-overflow-style: auto !important;
        }
        select::-webkit-scrollbar,
        input::-webkit-scrollbar,
        textarea::-webkit-scrollbar {
          display: block !important;
          width: 4px;
        }
        select::-webkit-scrollbar-thumb,
        input::-webkit-scrollbar-thumb,
        textarea::-webkit-scrollbar-thumb {
          background: rgba(153, 255, 0, 0.5);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}