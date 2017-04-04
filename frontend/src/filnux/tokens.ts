import {InjectionToken} from '@angular/core';

import {ReduxDevtoolsOptions} from './redux_devtools_extension';
import {Store} from './store';
import {StoreConfig} from './store_config';

export const STORE_CONFIG =
    new InjectionToken<StoreConfig>('[filnux] Scoped store');

export const REDUX_DEVTOOLS_EXTENSION =
    new InjectionToken<ReduxDevtoolsOptions>('Redux devtools extension');