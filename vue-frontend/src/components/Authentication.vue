<template>
  <div>
    <v-snackbar :timeout="6000" success :value="loggedOut">
      You've been successfully logged out!
      <v-btn dark flat @click.native="reset()">Thanks!</v-btn>
    </v-snackbar>
    <v-snackbar error :value="expired">
      Uh oh, your credentials expired. You'll need to log in again.
      <v-btn dark flat @click.native="reset()">Okay</v-btn>
    </v-snackbar>
    <form @submit.prevent="authenticateStudents">
      <v-card>
        <v-card-title primary-title class="headline">Students</v-card-title>
        <v-card-text>
          <p>
            <strong>Can I Graduate?</strong> works better if you're signed in. Enter your UChicago
            CNetID and password to import your data from AIS.
          </p>
          <div class="display-flex">
            <v-text-field class="mr-2 flex-grow" name="username" label="CNetID" v-model.lazy="students.username"
              :suffix="emailDomain" :rules="[() => rejected ? '' : true]"></v-text-field>
            <v-text-field class="ml-2 flex-grow" name="password" label="Password" v-model.lazy="students.password"
              type="password" :rules="[() => rejected ? '' : true]"></v-text-field>
          </div>
          </v-layout>
          <p class="red--text auth-error">
            {{ studentMessage }}
          </p>
        </v-card-text>
        <v-card-media>
          <v-alert warning value="true">
            By signing in, you agree to let
            <strong>Can I Graduate?</strong> pull your transcript from AIS and store your anonymized
            grades.
          </v-alert>
        </v-card-media>
        <v-card-actions>
          <v-spacer />
          <v-btn flat class="orange--text" :rules="[students.username!=''&& students.password!='' ? true : false]" :loading="studentLoading" type="submit">Sign In</v-btn>
        </v-card-actions>
      </v-card>
    </form>
    <form class="mt-3">
      <v-card>
        <v-card-title primary-title class="headline">Educators</v-card-title>
        <v-card-media>
          <v-tabs grow>
            <v-tabs-bar class="white">
              <v-tabs-slider class="blue"></v-tabs-slider>
              <v-tabs-item href="#sign-in">Sign in</v-tabs-item>
              <v-tabs-item href="#create-an-account">Create an account</v-tabs-item>
            </v-tabs-bar>
            <v-tabs-items>
              <v-tabs-content id="sign-in">
                <form @submit.prevent="authenticateEducators">
                  <v-card flat>
                    <v-card-text>
                      Manage your students' progress with
                      <strong>Can I Graduate?</strong> with ease!
                      <v-text-field name="username" label="Email address" v-model.lazy="educators.username"
                        required :rules="[() => rejected ? '' : true]"></v-text-field>
                      <v-text-field name="password" label="Password" v-model.lazy="educators.password"
                        type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                      <p class="red--text auth-error">
                        {{ educatorSignInMessage }}
                      </p>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <v-btn flat class="orange--text" :loading="educatorLoading" type="submit">Sign In</v-btn>
                    </v-card-actions>
                  </v-card>
                </form>
              </v-tabs-content>
              <v-tabs-content id="create-an-account">
                <form @submit.prevent="createEducatorAccount">
                  <v-card flat>
                    <v-card-text>
                      <v-text-field name="username" label="Email address (please use your school email)" v-model.lazy="educators.username"
                        type="email" required :rules="[validateEmail]"></v-text-field>
                      <v-text-field name="password" label="Password" v-model.lazy="educators.password"
                        type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                      <v-text-field name="password" label="Confirm password" type="password" required v-model.lazy="educators.confirmPassword"
                        :rules="[validateConfirmPassword]"></v-text-field>
                      <p :class="displayEducatorMessage">
                        {{ educatorRegisterMessage }}
                      </p>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <v-btn flat class="orange--text" :loading="educatorLoading" type="submit">Create an Account</v-btn>
                    </v-card-actions>
                  </v-card>
                </form>
              </v-tabs-content>
            </v-tabs-items>
          </v-tabs>
        </v-card-media>
      </v-card>
    </form>
  </div>
</template>

<script>
import { AuthenticationStatus } from '@/store/modules/authentication';
import { mapState, mapActions } from 'vuex';
export default {
  name: 'authentication',
  data() {
    return {
      students: { username: '', password: '' },
      educators: {
        username: '', password: '', confirmPassword: ''
      },
    };
  },
  created() {
    if (this.pending) {
      // The authentication state can get stuck in pending if the user refreshes, so just reset it appropriately.
      this.reset();
    }
  },
  computed: {
    ...mapState('authentication', {
      pending: state => state.status == AuthenticationStatus.PENDING,
      expired: state => state.status == AuthenticationStatus.EXPIRED,
      rejected: state => state.status == AuthenticationStatus.REJECTED,
      loggedOut: state => state.status == AuthenticationStatus.LOGGED_OUT,
      unauthenticated: state => state.status == AuthenticationStatus.UNAUTHENTICATED,
      studentMessage: state => state.studentMessage,
      educatorSignInMessage: state => state.educatorSignInMessage,
      educatorRegisterMessage: state => state.educatorRegisterMessage,
    }),
    ...mapState('institution', {
      emailDomain: state => state.emailDomain
    }),
    validateEmail() {
      return this.educators.username.indexOf(this.emailDomain) !== -1 || 'Must use your'+this.emailDomain+'email.';
    },
    validateConfirmPassword() {
      return this.educators.confirmPassword == this.educators.password || 'Must be the same as your password.';
    },
    studentLoading() {
      if (this.students.username != '' && this.students.password != '') {
        return this.pending
      }
    },
    educatorLoading() {
      if (this.educators.username != '' && this.educators.password != '') {
        return this.pending
      }
    },
    displayEducatorMessage() {
      if (this.unauthenticated) {
        return "green--text auth-error";
      } else {
        return "red--text auth-error";
      }
    }
  },
  methods: {
    ...mapActions('authentication', ['reset']),
    authenticateStudents() {
      this.$store.dispatch('authentication/authenticate', this.students);
    },
    authenticateEducators() {
      this.$store.dispatch('authentication/authenticateEducators', this.educators);
    },
    createEducatorAccount() {
      this.$store.dispatch('authentication/createEducatorAccount', this.educators);
    },
  },
}
</script>

<style scoped>
.auth-error {
  margin-top: -6px;
}
</style>
