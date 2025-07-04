import React, { useState, useEffect } from 'react';

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return visible ? (
    <button className="scroll-to-top-btn" onClick={handleClick} title="Ir arriba">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M12 5l-7 7M12 5l7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  ) : null;
};

export default ScrollToTopButton;
