const DEFAULT_STATE = {
  activeTerm: "",
  temporary: {}
};

export default {
  namespaced: true,
  state: { ...DEFAULT_STATE },
  mutations: {
    setActiveTerm(state, term) {
      state.activeTerm = term;
    },
    set(state, data) {
      Object.assign(state, data);
    }
  },
  actions: {
    setTemporarySection(context, temporary) {
      context.commit("set", { temporary });
    },
    clearTemporary(context) {
      context.commit("set", { temporary: {} });
    }
  }
};
