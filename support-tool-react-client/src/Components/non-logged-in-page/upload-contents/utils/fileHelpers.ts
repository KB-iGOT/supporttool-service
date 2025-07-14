// Check if PDF can be viewed in the browser
export const canPreviewPDF = (): boolean => {
  const isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
  const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Chrome, Firefox, and Safari have good PDF viewer support
  return isChrome || isFirefox || isSafari;
};

// Get file size in human-readable format
export const getFormattedFileSize = (bytes: number): string => {
  if (bytes / 1024 > 1024) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }
  return (bytes / 1024).toFixed(2) + ' KB';
};