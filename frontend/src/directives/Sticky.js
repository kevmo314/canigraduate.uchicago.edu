import Vue from "vue";
import Stickyfill from "stickyfill";

const STICKYFILL = Stickyfill();

export default Vue.directive("stickyfill", {
  bind(el) {
    el.style.position = "sticky";
    el.style.top = "75px";
    Vue.nextTick(() => STICKYFILL.add(el));
  },
  unbind(el) {
    STICKYFILL.remove(el);
  }
});
