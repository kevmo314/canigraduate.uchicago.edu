export const AuthenticationStatus = {
  UNAUTHENTICATED: 'unauthenticated',
  EXPIRED: 'expired',
  LOGGED_OUT: 'logged out',
  REJECTED: 'rejected',
  PENDING: 'pending',
  AUTHENTICATED: 'authenticated',
};

const DEFAULT_STATE = {
  username: '',
  password: '',
  token: null,
  status: AuthenticationStatus.UNAUTHENTICATED,
  message: '',
  data: {},
};

export default {
  namespaced: true,
  state: { ...DEFAULT_STATE },
  mutations: {
    update(state, params) {
      Object.assign(state, params);
    },
  },
  actions: {
    async authenticate(context, data = {}) {
      context.commit('update', {
        ...data,
        status: AuthenticationStatus.PENDING,
        message: '',
      });
      await context.rootState.institution.endpoints
        .transcript(context.state)
        .subscribe(
          response => {
            context.commit('update', {
              status: AuthenticationStatus.AUTHENTICATED,
              token: response.data.token,
              data: response.data.data,
            });
            context.commit('transcript/update', response.data.transcript, {
              root: true,
            });
          },
          error => {
            context.commit('update', {
              message: error.response
                ? error.response.data.error
                : error.message,
              status: AuthenticationStatus.REJECTED,
            });
          },
        );
    },
    reset(context, status = AuthenticationStatus.UNAUTHENTICATED) {
      if (context.state.status == AuthenticationStatus.AUTHENTICATED) {
        context.rootState.institution.endpoints.signOut();
      }
      context.commit('update', { ...DEFAULT_STATE, status });
    },
  },
};
