import axios from 'axios';
import olduchicago from '@/institutions/olduchicago';
import firestore from '@/models/firestore';
import Institution from '@/models/institution';

export default {
  namespaced: true,
  state: {key:'uchicago'},
  mutations: {
    setInstitution(state, institution) {
      Object.assign(state, institution);
    },
  },
  getters: {
    // This is done as a getter to prevent Vuex from attempting to observe the entire Institution object.
    institution: state => {
      return new Institution(firestore.collection('institutions').doc(state.key));
    },
  },
  actions: {
    change(context, institution) {
      context.commit('setInstitution', institution);
      context.dispatch('filter/reset', null, { root: true });
    },
  },
};
