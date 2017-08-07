import axios from 'axios';
import uchicago from '@/institutions/uchicago';

export default {
  namespaced: true,
  state: uchicago,
  mutations: {
    change(state, institution) {
      state = institution;
    },
  },
};
