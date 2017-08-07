export default {
  namespaced: true,
  state: {
    query: '',
    periods: [], // Populated in Search to get the right max value.
    days: [0, 1, 2, 3, 4],
    departments: [],
    instructors: [],
  },
  mutations: {
    update(state, params) {
      Object.assign(state, params);
    },
  },
  actions: {
    reset(context) {
      context.commit('update', {
        query: '',
        periods: Array(context.rootState.institution.periods.length)
          .fill(0)
          .map((x, y) => x + y),
        days: [0, 1, 2, 3, 4],
        departments: [],
        instructors: [],
      });
    },
  },
};
