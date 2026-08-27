import React from 'react';

interface CourseraLogoProps {
  className?: string;
}

export const CourseraLogo: React.FC<CourseraLogoProps> = ({ className = "w-3.5 h-3.5" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Coursera"
    >
      {/* Official Coursera Infinity Ribbon / C geometry */}
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 14.85c-2.67 0-4.85-2.18-4.85-4.85s2.18-4.85 4.85-4.85c1.35 0 2.58.55 3.46 1.44l-1.42 1.42c-.52-.52-1.25-.84-2.04-.84-1.57 0-2.85 1.28-2.85 2.85s1.28 2.85 2.85 2.85c.79 0 1.52-.32 2.04-.84l1.42 1.42c-.88.89-2.11 1.44-3.46 1.44z"
      />
      <path
        d="M14.5 9.5l3.5 2.5-3.5 2.5v-5z"
        fill="#0056D2"
      />
    </svg>
  );
};
