'use client';

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const AiImportIconWithAnimation = () => {
  const starClasses = "fill-current text-gray-800 dark:text-gray-300 transition-colors duration-300 ease-in-out group-hover:text-purple-500";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path className={starClasses} d="M7 3 L7.5 5 L9.5 5.5 L7.5 6 L7 8 L6.5 6 L4.5 5.5 L6.5 5 Z" />
      <path className={starClasses} d="M17 2 L17.5 4 L19.5 4.5 L17.5 5 L17 7 L16.5 5 L14.5 4.5 L16.5 4 Z" />
      <path className={starClasses} d="M20 8 L20.25 9 L21.25 9.25 L20.25 9.5 L20 10.5 L19.75 9.5 L18.75 9.25 L19.75 9 Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5" />
    </svg>
  );
};

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);


//TODO: implémenter logique derrières les bouttons
const BDActionsButtons = () => {
  const buttonStyle = "p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-r border-gray-300 dark:border-gray-700 last:border-r-0";
  return (
    <div className="relative group/container">
      <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
        <button onClick={() => {}} className={buttonStyle}>
          <ExportIcon />
        </button>
        <button onClick={() => {}} className={buttonStyle}>
          <ImportIcon />
        </button>
        <button onClick={() => {}} className={`${buttonStyle} group`}>
          <AiImportIconWithAnimation />
        </button>
        <button onClick={() => {}} className={buttonStyle}>
          <ClearIcon />
        </button>
      </div>
    </div>
  );
};

export default BDActionsButtons;