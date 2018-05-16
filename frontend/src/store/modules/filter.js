export default {
  namespaced: true,
  state: {
    query: '',
    periods: [0, 1, 2, 3, 4, 5, 6, 7],
    days: [0, 1, 2, 3, 4, 5, 6],
    departments: [],
    instructors: [],
  },
  mutations: {
    update(state, params) {
      Object.assign(state, params);
    },
  },
  actions: {
    reset(context, params = {}) {
      context.commit('update', {
        query: '',
        periods: [0, 1, 2, 3, 4, 5, 6, 7],
        days: [0, 1, 2, 3, 4, 5, 6],
        departments: [],
        instructors: [],
        ...params,
      });
    },
  },
};
