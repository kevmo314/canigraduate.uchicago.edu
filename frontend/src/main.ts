import { Observable, of } from "rxjs";
import { pluck } from "rxjs/operators";
import Vue from "vue";
import Vuetify from "vuetify";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

require("../node_modules/vuetify/dist/vuetify.min.css");

Vue.config.productionTip = false;

Vue.use(Vuetify, {
  theme: {
    primary: "#1976D2",
    accent: "#448AFF",
    secondary: "#424242",
    info: "#2196F3",
    warning: "#ffc107",
    error: "#F44336",
    success: "#4CAF50"
  }
});

Vue.mixin({
  created() {
    const vm = this;
    let obs = vm.$options.subscriptions;
    if (typeof obs === "function") {
      obs = obs.call(vm);
    }
    if (obs) {
      const keys = Object.keys(obs);
      keys.forEach(key =>
        (Vue as any).util.defineReactive(
          vm,
          key,
          undefined /* val */,
          null /* customSetter */,
          false /* shallow */
        )
      );
      vm._subscriptions = keys.map(key => {
        return (obs[key] instanceof Observable
          ? obs[key]
          : of(obs[key])
        ).subscribe(
          value => (vm[key] = value),
          error => {
            throw error;
          }
        );
      });
    }
  },

  beforeDestroy() {
    if (this._subscriptions) {
      this._subscriptions.forEach(handle => handle.unsubscribe());
    }
  }
});

Vue.prototype.$observe = function(fn, options = {}) {
  const vm = this;
  const obs$ = Observable.create(observer => {
    let _unwatch;
    const watch = () => {
      _unwatch = vm.$watch(
        fn,
        (newValue, oldValue) => {
          observer.next({ oldValue: oldValue, newValue: newValue });
        },
        { immediate: true, ...options }
      );
    };

    // if $watchAsObservable is called inside the subscriptions function,
    // because data hasn't been observed yet, the watcher will not work.
    // in that case, wait until created hook to watch.
    if (vm._data) {
      watch();
    } else {
      vm.$once("hook:created", watch);
    }

    // Returns function which disconnects the $watch expression
    return () => _unwatch && _unwatch();
  });
  return obs$.pipe(pluck("newValue"));
};

const PRODUCTION = process.env.NODE_ENV === "PRODUCTION";

Vue.config.silent = PRODUCTION;
Vue.config.performance = !PRODUCTION;

export default new Vue({
  router: router,
  store: store,
  render: h => h(App)
}).$mount("#app");
