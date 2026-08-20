import React from 'react';

interface UdemyLogoProps {
  className?: string;
}

export const UdemyLogo: React.FC<UdemyLogoProps> = ({ className = "w-3.5 h-3.5" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Udemy"
    >
      <path d="M12 1.5L6.5 4.5v6.5c0 4.2 2.8 8.1 5.5 9 2.7-.9 5.5-4.8 5.5-9V4.5L12 1.5zm3.5 11c0 1.9-1.6 3.5-3.5 3.5s-3.5-1.6-3.5-3.5V6.5h2.2v6c0 .7.6 1.3 1.3 1.3s1.3-.6 1.3-1.3v-6h2.2v6z" />
    </svg>
  );
};
