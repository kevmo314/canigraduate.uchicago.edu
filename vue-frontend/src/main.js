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

Vue.config.performance = process.env.NODE_ENV !== 'production';

export default new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App },
});
