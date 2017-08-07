<template>
  <div>
    <v-snackbar :timeout="6000" success v-model="loggedOutSnackbar">
      You've been successfully logged out!
      <v-btn dark flat @click.native="loggedOutSnackbar = false">Thanks!</v-btn>
    </v-snackbar>
    <v-snackbar error v-model="expiredSnackbar">
      Uh oh, your credentials expired. You'll need to log in again.
      <v-btn dark flat @click.native="expiredSnackbar = false">Okay</v-btn>
    </v-snackbar>
    <form>
      <v-card>
        <v-card-title primary-title class="headline">Students</v-card-title>
        <v-card-text>
          <p>
            <strong>Can I Graduate?</strong> works better if you're signed in. Enter your UChicago CNetID and password to import your data from AIS.
          </p>
          <v-layout row>
            <v-flex fluid>
              <v-text-field name="username" label="CNetID" v-model="username" required :rules="[() => rejected ? '' : true]"></v-text-field>
            </v-flex>
            <v-flex fluid>
              <v-text-field name="password" label="Password" v-model="password" type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
            </v-flex>
          </v-layout>
          <p class="red--text caption auth-error">
            {{ message }}
          </p>
          </v-layout>
        </v-card-text>
        <v-card-media>
          <v-alert warning value="true">
            By signing in, you agree to let
            <strong>Can I Graduate?</strong> pull your transcript from AIS and store your anonymized grades.
          </v-alert>
        </v-card-media>
        <v-card-actions>
          <v-btn flat class="orange--text" @click="authenticate()" :disabled="pending" type="submit">Sign In</v-btn>
        </v-card-actions>
        <v-progress-linear v-if="pending" :indeterminate="true" class="ma-0" height="4"></v-progress-linear>
      </v-card>
    </form>
    <form class="mt-3">
      <v-card>
        <v-card-title primary-title class="headline">Educators</v-card-title>
        <v-card-media>
          <v-tabs grow>
            <v-tabs-bar slot="activators" class="white">
              <v-tabs-slider class="blue"></v-tabs-slider>
              <v-tabs-item href="#sign-in">Sign in</v-tabs-item>
              <v-tabs-item href="#create-an-account">Create an account</v-tabs-item>
            </v-tabs-bar>
            <v-tabs-content id="sign-in">
              <v-card flat>
                <v-card-text>
                  Manage your students' progress with
                  <strong>Can I Graduate?</strong> with ease!
                  <v-text-field name="username" label="Email address" v-model="username" required :rules="[() => rejected ? '' : true]"></v-text-field>
                  <v-text-field name="password" label="Password" v-model="password" type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                </v-card-text>
              </v-card>
            </v-tabs-content>
            <v-tabs-content id="create-an-account">
              <v-card flat>
                <v-card-text>
                  <v-text-field name="username" label="Email address" v-model="username" required :rules="[() => rejected ? '' : true]"></v-text-field>
                  <v-text-field name="password" label="Password" v-model="password" type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                  <v-text-field name="password" label="Confirm password" v-model="password" type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                </v-card-text>
              </v-card>
            </v-tabs-content>
          </v-tabs>
        </v-card-media>
        <v-progress-linear v-if="pending" :indeterminate="true" class="ma-0" height="4"></v-progress-linear>
      </v-card>
    </form>
  </div>
</template>

<script>
import { AuthenticationStatus } from '@/store/modules/authentication';
import { mapState, mapActions } from 'vuex';
export default {
  name: 'authentication',
  data() { return { snackbar: true } },
  computed: {
    ...mapState('authentication', {
      pending: state => state.status == AuthenticationStatus.PENDING,
      expired: state => state.status == AuthenticationStatus.EXPIRED,
      rejected: state => state.status == AuthenticationStatus.REJECTED,
      loggedOut: state => state.status == AuthenticationStatus.LOGGED_OUT,
      message: state => state.message,
    }),
    loggedOutSnackbar: {
      get() { return this.loggedOut && this.snackbar },
      set(value) { this.snackbar = value }
    },
    expiredSnackbar: {
      get() { return this.expired && this.snackbar },
      set(value) { this.snackbar = value }
    },
    username: {
      get() {
        return this.$store.state.authentication.username;
      },
      set(value) {
        this.$store.commit('authentication/update', { username: value });
      }
    },
    password: {
      get() {
        return this.$store.state.authentication.password;
      },
      set(value) {
        this.$store.commit('authentication/update', { password: value });
      }
    }
  },
  methods: mapActions('authentication', ['authenticate'])
}
</script>

<style scoped>
.auth-error {
  margin-top: -36px;
}
</style>
