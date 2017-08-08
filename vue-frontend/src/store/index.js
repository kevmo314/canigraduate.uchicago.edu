import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import createLogRocket from 'logrocket-vuex';
import LogRocket from 'logrocket';
import * as modules from './modules';

const PRODUCTION = process.env.NODE_ENV === 'production';

Vue.use(Vuex);

const plugins = [
  createPersistedState({
    paths: Object.keys(modules).filter(m => m != 'institution'),
  }),
];

if (PRODUCTION) {
  LogRocket.init('e5pnvu/can-i-graduate');
  plugins.push(createLogRocket(LogRocket));
}

export default new Vuex.Store({
  modules,
  strict: !PRODUCTION,
  plugins,
});

if (!PRODUCTION && module.hot) {
  module.hot.accept(Object.keys(modules).map(m => './modules/' + m), () => {
    store.hotUpdate({
      modules: Object.keys(modules).reduce(
        (obj, m) => (obj[m] = require('./modules/' + m).default),
        {},
      ),
    });
  });
}
