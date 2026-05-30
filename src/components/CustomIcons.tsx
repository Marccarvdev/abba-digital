import React from 'react';

export const RefreshCw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M54.89,26.73A23.52,23.52,0,0,1,15.6,49" />
    <path d="M9,37.17a23.75,23.75,0,0,1-.53-5A23.51,23.51,0,0,1,48.3,15.2" />
    <polyline points="37.73 16.24 48.62 15.44 47.77 5.24" />
    <polyline points="25.91 47.76 15.03 48.56 15.88 58.76" />
  </svg>
);

export const Scissors: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 256 256"
    fill="currentColor"
    {...props}
  >
    <path d="M157.73193,113.13086a8.00047,8.00047,0,0,1,2.085-11.12012l67.66553-46.29785A8.00013,8.00013,0,0,1,236.51758,68.918l-67.66553,46.29785a7.99794,7.99794,0,0,1-11.12012-2.085Zm80.87061,85.07129a7.99794,7.99794,0,0,1-11.12012,2.085l-91.4826-62.59351L93.49408,166.77686a36.034,36.034,0,1,1-9.05035-13.19458l37.38867-25.582-37.3891-25.582a35.84637,35.84637,0,1,1,9.0506-13.19458L236.51758,187.082A8.00047,8.00047,0,0,1,238.60254,198.20215ZM80,180a20,20,0,1,0-5.85791,14.1416A19.86692,19.86692,0,0,0,80,180ZM74.14209,90.1416a20,20,0,1,0-28.28418,0A19.86692,19.86692,0,0,0,74.14209,90.1416Z"/>
  </svg>
);

export const Bookmark: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M6.75 6L7.5 5.25H16.5L17.25 6V19.3162L12 16.2051L6.75 19.3162V6ZM8.25 6.75V16.6838L12 14.4615L15.75 16.6838V6.75H8.25Z" fill="currentColor"/>
  </svg>
);

export const Undo2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 21 21"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" transform="translate(3 6)">
      <path d="m1.378 1.376 4.243.003v4.242" transform="matrix(-.70710678 .70710678 .70710678 .70710678 3.500179 -1.449821)"/>
      <path d="m5.5 9.49998326h5c2 .00089417 3-.99910025 3-2.99998326s-1-3.00088859-3-3.00001674h-10"/>
    </g>
  </svg>
);

export const SafeAvatar: React.FC<{ src?: string; name?: string; className?: string }> = ({ src, name, className = "w-10 h-10" }) => {
  const [failed, setFailed] = React.useState(false);
  const initials = (name || "U").substring(0, 2).toUpperCase();

  // Se a imagem falhar, não for uma URL válida, ou se estivermos offline sem cache
  if (failed || !src || typeof src !== 'string' || (!src.startsWith('http') && !src.startsWith('/'))) {
    return (
      <div 
        className={`${className} rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white select-none shadow-sm shrink-0`} 
        style={{ fontSize: '11px', letterSpacing: '0.5px' }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${className} rounded-full object-cover shrink-0`}
      onError={() => setFailed(true)}
    />
  );
};
