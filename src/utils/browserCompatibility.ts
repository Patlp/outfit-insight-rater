// Browser compatibility utilities
export const checkBrowserSupport = (): { supported: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check for FileReader support
  if (!window.FileReader) {
    issues.push('File reading not supported');
  }

  // Check for Blob support
  if (!window.Blob) {
    issues.push('Blob handling not supported');
  }

  // Check for Canvas support (for image processing)
  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.getContext('2d')) {
    issues.push('Canvas not supported');
  }

  // Check for localStorage
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
  } catch (e) {
    issues.push('Local storage not available');
  }

  // Check for Promise support
  if (!window.Promise) {
    issues.push('Promise not supported');
  }

  // Check for fetch support
  if (!window.fetch) {
    issues.push('Fetch API not supported');
  }

  return {
    supported: issues.length === 0,
    issues
  };
};

export const initializeBrowserCompatibility = (): void => {
  const { supported, issues } = checkBrowserSupport();
  
  console.log('Browser compatibility check:', { supported, issues });
  
  if (!supported) {
    console.warn('Browser compatibility issues detected:', issues);
    
    // Show warning to user if critical features are missing
    if (issues.some(issue => 
      issue.includes('File reading') || 
      issue.includes('Blob') || 
      issue.includes('fetch')
    )) {
      console.error('Critical browser features missing. App may not function properly.');
    }
  }

  // Add global error handler for better debugging
  window.addEventListener('error', (event) => {
    console.error('Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });

  // Add promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
};