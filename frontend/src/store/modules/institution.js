import axios from 'axios';
import uchicago from '@/institutions/uchicago';

export default {
  namespaced: true,
  state: uchicago,
  mutations: {
    setInstitution(state, institution) {
      Object.assign(state, institution);
    },
  },
  actions: {
    change(context, institution) {
      context.commit('setInstitution', institution);
      context.dispatch('filter/reset', null, { root: true });
    },
  },
};
