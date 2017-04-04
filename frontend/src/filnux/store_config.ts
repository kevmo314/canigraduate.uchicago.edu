import {Type} from '@angular/core';
import {Action} from 'filnux/store_module';

import {ReduxDevtoolsOptions} from './redux_devtools_extension';
import {Reducer, State} from './store_module';

export interface StoreConfig {
  children?: Type<any>[];
  reducer?: Reducer<State, Action>;
  module: Type<any>;
  devtoolsOptions?: ReduxDevtoolsOptions;
}
