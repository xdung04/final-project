export const SuccessIcon = ({ width = "20px", height = "20px", className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="#07bc0c"
  >
    <path d="M12 0a12 12 0 1012 12A12.014 12.014 0 0012 0zm6.927 8.2l-6.845 9.289a1.011 1.011 0 01-1.43.188l-4.888-3.908a1 1 0 111.25-1.562l4.076 3.261 6.227-8.451a1 1 0 111.61 1.183z"></path>
  </svg>
);

export const CloseIcon = ({ width = "14px", height = "16px", className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    aria-hidden="true"
    viewBox="0 0 14 16"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M7.71 8.23l3.75 3.75-1.48 1.48-3.75-3.75-3.75 3.75L1 11.98l3.75-3.75L1 4.48 2.48 3l3.75 3.75L9.98 3l1.48 1.48-3.75 3.75z"
    ></path>
  </svg>
);

export const ErrorIcon = ({ width = "20px", height = "20px", className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="#f85f5f"
  >
    <path d="M11.983 0a12.206 12.206 0 00-8.51 3.653A11.8 11.8 0 000 12.207 11.779 11.779 0 0011.8 24h.214A12.111 12.111 0 0024 11.791 11.766 11.983 0 0011.983 0zM10.5 16.542a1.476 1.476 0 011.449-1.53h.027a1.527 1.527 0 011.523 1.47 1.475 1.475 0 01-1.449 1.53h-.027a1.529 1.529 0 01-1.523-1.47zM11 12.5v-6a1 1 0 012 0v6a1 1 0 11-2 0z"></path>
  </svg>
);

// ✅ THÊM MỚI
export const InfoIcon = ({ width = "20px", height = "20px", className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="#3498db"
  >
    <path d="M12 0a12 12 0 1012 12A12.014 12.014 0 0012 0zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm1.25 12h-2.5v-7h2.5v7z"></path>
  </svg>
);