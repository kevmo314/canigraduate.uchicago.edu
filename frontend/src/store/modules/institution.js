import axios from 'axios';
import olduchicago from '@/institutions/olduchicago';
import firestore from '@/models/firestore';
import Institution from '@/models/institution';

export default {
  namespaced: true,
  state: olduchicago,
  mutations: {
    setInstitution(state, institution) {
      Object.assign(state, institution);
    },
  },
  getters: {
    institution: state => {
      const ref = firestore.collection('institutions').doc(state.transitional);
      return new Institution(ref);
    },
  },
  actions: {
    change(context, institution) {
      context.commit('setInstitution', institution);
      context.dispatch('filter/reset', null, { root: true });
    },
  },
};
