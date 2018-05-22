export const SORT = {
  BY_POPULARITY: 0,
  ALPHABETICALLY: 1,
};

export default {
  namespaced: true,
  state: {
    expanded: [],
    page: 1,
    sort: SORT.BY_POPULARITY,
  },
  mutations: {
    setExpanded(state, { course, expanded }) {
      const index = state.expanded.indexOf(course);
      if (expanded == index > -1) {
        return;
      }
      if (expanded) {
        state.expanded.push(course);
      } else {
        state.expanded.splice(index, 1);
      }
    },
    setPage(state, page) {
      state.page = page;
    },
    update(state, params) {
      Object.assign(state, params);
    },
  },
};
