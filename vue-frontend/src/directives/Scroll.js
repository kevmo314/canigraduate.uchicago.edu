import Vue from 'vue';
import VueScrollto from 'vue-scrollto';

export default Vue.directive('scroll', (element, binding) => {
  if (binding.value) {
    VueScrollto.scrollTo(element);
  }
});
