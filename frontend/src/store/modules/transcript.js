export default {
  namespaced: true,
  state: [],
  mutations: {
    update(state, records) {
      state.length = 0;
      state.push(...records);
    },
  },
  actions: {},
};
