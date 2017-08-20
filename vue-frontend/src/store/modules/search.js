export default {
  namespaced: true,
  state: {
    expanded: [],
    page: 1,
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
  },
};
