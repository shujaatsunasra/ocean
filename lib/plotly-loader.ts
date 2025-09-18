// Global Plotly loader to pre-load the library
let plotlyPromise: Promise<any> | null = null;
let plotlyInstance: any = null;

export const loadPlotly = async (): Promise<any> => {
  if (plotlyInstance) {
    return plotlyInstance;
  }

  if (plotlyPromise) {
    return plotlyPromise;
  }

  plotlyPromise = import('plotly.js-dist-min').then(module => {
    plotlyInstance = module.default;
    console.log('✅ Plotly loaded and cached globally');
    return plotlyInstance;
  }).catch(err => {
    console.error('❌ Failed to load Plotly:', err);
    plotlyPromise = null; // Reset so we can try again
    throw err;
  });

  return plotlyPromise;
};

export const getPlotly = (): any => {
  return plotlyInstance;
};

export const isPlotlyLoaded = (): boolean => {
  return plotlyInstance !== null;
};
