module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['karma-typescript', 'jasmine'],
    files: [
      'test/**/*.ts', // *.tsx for React Jsx
    ],
    preprocessors: {
      '**/*.ts': 'karma-typescript', // *.tsx for React Jsx
    },
    reporters: ['progress', 'karma-typescript'],
    browsers: ['ChromeHeadless'],
    tsconfig: './tsconfig.json',
    port: 9876,
    colors: true,
    autoWatch: true,
    singleRun: false,
    concurrency: Infinity,
  });
};
