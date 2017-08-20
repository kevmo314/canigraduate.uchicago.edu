const DEFAULT_STATE = {
  activeTerm: '',
};

export default {
  namespaced: true,
  state: { ...DEFAULT_STATE },
  mutations: {
    setActiveTerm(state, term) {
      state.activeTerm = term;
    },
  },
  actions: {},
};
