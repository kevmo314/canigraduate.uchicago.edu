import Vue from 'vue';
import App from './App';
import router from './router';
import Vuetify from 'vuetify';
import Vuex from 'vuex';
import store from './store';
import VueRx from 'vue-rx';
import Rx from 'rxjs/Rx';

Vue.use(Vuetify);
Vue.use(VueRx, Rx);

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
