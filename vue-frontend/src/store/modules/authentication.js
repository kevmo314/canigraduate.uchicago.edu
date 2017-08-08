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
  state: Object.assign({}, DEFAULT_STATE),
  mutations: {
    update(state, params) {
      Object.assign(state, params);
    },
  },
  actions: {
    async authenticate(context) {
      context.commit('update', {
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
    reset(context) {
      context.commit(
        'update',
        Object.assign({}, DEFAULT_STATE, {
          status: AuthenticationStatus.LOGGED_OUT,
        }),
      );
    },
  },
};
