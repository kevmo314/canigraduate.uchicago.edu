import Vue from 'vue';
import App from './App';
import router from './router';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import store from './store';
import VueRx from 'vue-rx';
import VueTimeago from 'vue-timeago';
import VueScrollto from 'vue-scrollto';
import { Observable, Subscription, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

require('../node_modules/vuetify/dist/vuetify.min.css');

Vue.use(Vuetify, {
  theme: {
    primary: '#1976D2',
    accent: '#448AFF',
    secondary: '#424242',
    info: '#2196F3',
    warning: '#ffc107',
    error: '#F44336',
    success: '#4CAF50',
  },
});
Vue.use(VueTimeago, {
  locale: 'en-US',
  locales: { 'en-US': require('vue-timeago/locales/en-US.json') },
});
Vue.use(VueScrollto, {
  offset: -75, // Account for header bar.
});

Vue.prototype.$observe = function(fn) {
  return this.$watchAsObservable(fn, { immediate: true }).pipe(
    map(state => state.newValue),
  );
};

Vue.use(VueRx, { Observable, Subscription, Subject });

const PRODUCTION = process.env.NODE_ENV === 'PRODUCTION';

Vue.config.silent = PRODUCTION;
Vue.config.performance = !PRODUCTION;

export default new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
});
