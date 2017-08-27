import IntervalTree from '@/lib/interval-tree';

export default {
  namespaced: true,
  state: {
    query: '',
    periods: [0, 1, 2, 3, 4, 5, 6, 7],
    days: [0, 1, 2, 3, 4, 5, 6],
    departments: [],
    instructors: [],
  },
  getters: {
    daysIntervalTree: state => {
      return state.days
        .map(day => [1440 * day, 1440 * (day + 1)])
        .reduce((tree, interval) => tree.add(interval), new IntervalTree());
    },
  },
  mutations: {
    update(state, params) {
      Object.assign(state, params);
    },
  },
  actions: {
    reset(context, params = {}) {
      context.commit(
        'update',
        Object.assign(
          {
            query: '',
            periods: Array(context.rootState.institution.periods.length)
              .fill(0)
              .map((x, y) => x + y),
            days: [0, 1, 2, 3, 4, 5, 6],
            departments: [],
            instructors: [],
          },
          params,
        ),
      );
    },
  },
};
