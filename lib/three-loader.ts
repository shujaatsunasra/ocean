// Global Three.js loader to pre-load the library
let threePromise: Promise<any> | null = null;
let threeInstance: any = null;

export const loadThree = async (): Promise<any> => {
  if (threeInstance) {
    return threeInstance;
  }

  if (threePromise) {
    return threePromise;
  }

  threePromise = import('three').then(module => {
    threeInstance = module;
    console.log('✅ Three.js loaded and cached globally');
    return threeInstance;
  }).catch(err => {
    console.error('❌ Failed to load Three.js:', err);
    threePromise = null; // Reset so we can try again
    throw err;
  });

  return threePromise;
};

export const getThree = (): any => {
  return threeInstance;
};

export const isThreeLoaded = (): boolean => {
  return threeInstance !== null;
};
