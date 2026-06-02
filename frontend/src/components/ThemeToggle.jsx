import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [lightMode, setLightMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('faq-theme') === 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('light-mode', lightMode);
    window.localStorage.setItem('faq-theme', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  return (
    <button
      type="button"
      className="btn theme-toggle"
      onClick={() => setLightMode((prev) => !prev)}
      aria-label="Toggle dark and light mode"
    >
      {lightMode ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};

export default ThemeToggle;
