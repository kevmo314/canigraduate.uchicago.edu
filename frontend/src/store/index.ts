import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import createLogRocket from 'logrocket-vuex';
import LogRocket from 'logrocket';
import authentication from './modules/authentication';
import calendar from './modules/calendar';
import filter from './modules/filter';
import institution from './modules/institution';
import search from './modules/search';
import transcript from './modules/transcript';

const modules = {
  authentication,
  calendar,
  filter,
  institution,
  search,
  transcript,
};

const PRODUCTION = process.env.NODE_ENV === 'production';

Vue.use(Vuex);

const plugins = [
  createPersistedState({
    paths: Object.keys(modules).filter(m => m != 'institution'),
  }),
];

if (PRODUCTION) {
  LogRocket.init('e5pnvu/can-i-graduate');
  plugins.push(
    createLogRocket(LogRocket, mutation => {
      if (mutation.type == 'authentication/update') {
        return {
          type: mutation.type,
          payload: {
            ...mutation.payload,
            password: undefined,
          },
        };
      }
      return mutation;
    }),
  );
}

export default new Vuex.Store({
  modules,
  strict: !PRODUCTION,
  plugins,
});
