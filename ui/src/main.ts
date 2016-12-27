import './polyfills.ts';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppModule } from './app/';

import { hmrBootstrap } from './hmr';

if (environment.production) {
  enableProdMode();
}

if (environment.hmr) {
  if (module['hot']) {
    hmrBootstrap(module, () => platformBrowserDynamic().bootstrapModule(AppModule));
  } else {
    console.error('HMR is not enabled for webpack-dev-server!');
    console.log('Are you using the --hmr flag for ng serve?');
  }
} else {
  platformBrowserDynamic().bootstrapModule(AppModule);
}
