import * as Stickyfill from "stickyfilljs";
import Vue from "vue";

export default Vue.directive("stickyfill", {
  bind(el: HTMLElement) {
    el.style.position = "sticky";
    el.style.top = "75px";
    Vue.nextTick(() => Stickyfill.add(el));
  },
  unbind(el: HTMLElement) {
    Stickyfill.remove(el);
  }
});
