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
              :suffix="'@' + emailDomain" :rules="[() => rejected ? '' : true]" :disabled="pending"></v-text-field>
            <v-text-field class="ml-2 flex-grow" name="password" label="Password" v-model.lazy="students.password"
              type="password" :rules="[() => rejected ? '' : true]" :disabled="pending"></v-text-field>
          </div>
          <p class="red--text auth-error" v-if="this.studentType">
            {{ message }}
          </p>
        </v-card-text>
        <v-card-media>
          <v-alert color="warning" icon="priority_high" value="true">
            By signing in, you agree to let
            <strong>Can I Graduate?</strong> pull your transcript from AIS and store your anonymized
            grades.
          </v-alert>
        </v-card-media>
        <v-card-actions>
          <v-spacer />
          <v-btn flat class="orange--text" :rules="[students.username!=''&& students.password!='' ? true : false]" :loading="studentType&&pending" :disabled="educatorType&&pending" type="submit">Sign In</v-btn>
        </v-card-actions>
      </v-card>
    </form>
    <form class="mt-3">
      <v-card>
        <v-card-title primary-title class="headline">Educators</v-card-title>
        <v-card-media>
          <v-tabs grow color="white" slider-color="blue">
            <v-tab href="#sign-in">Sign in</v-tab>
            <v-tab-item id="sign-in">
              <form @submit.prevent="authenticateEducators">
                <v-card flat>
                  <v-card-text>
                    Manage your students' progress with
                    <strong>Can I Graduate?</strong> with ease!
                    <v-text-field name="username" label="Email address" v-model.lazy="educators.username"
                      required :rules="[() => rejected ? '' : true]"></v-text-field>
                    <v-text-field name="password" label="Password" v-model.lazy="educators.password"
                      type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                    <p class="red--text auth-error" v-if="this.educatorType">
                      {{ message }}
                    </p>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn flat class="orange--text" :loading="educatorType&&pending" :disabled="studentType&&pending" type="submit">Sign In</v-btn>
                  </v-card-actions>
                </v-card>
              </form>
            </v-tab-item>
            <v-tab href="#create-an-account">Create an account</v-tab>
            <v-tab-item id="create-an-account">
              <form @submit.prevent="createEducatorAccount">
                <v-card flat>
                  <v-card-text>
                    <v-text-field name="username" label="Email address (please use your school email)" v-model.lazy="educators.username"
                      type="email" required :rules="[validateEmail]"></v-text-field>
                    <v-text-field name="password" label="Password" v-model.lazy="educators.password"
                      type="password" required :rules="[() => rejected ? '' : true]"></v-text-field>
                    <v-text-field name="password" label="Confirm password" type="password" required v-model.lazy="educators.confirmPassword"
                      :rules="[validateConfirmPassword]"></v-text-field>
                    <p :class="{'auth-error green--text': unauthenticated, 'auth-error red--text': !unauthenticated}" v-if="this.educatorRegisterType">
                      {{ message }}
                    </p>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn flat class="orange--text" :loading="educatorType&&pending" :disabled="studentType&&pending" type="submit">Create an Account</v-btn>
                  </v-card-actions>
                </v-card>
              </form>
            </v-tab-item>
          </v-tabs>
        </v-card-media>
      </v-card>
    </form>
  </div>
</template>

<script>
import {
  AuthenticationStatus,
  AuthenticationType
} from "@/store/modules/authentication";
import { mapState, mapActions, mapGetters } from "vuex";
import { switchMap, map } from "rxjs/operators";
export default {
  name: "authentication",
  data() {
    return {
      students: { username: "", password: "" },
      educators: {
        username: "",
        password: "",
        confirmPassword: ""
      }
    };
  },
  created() {
    if (this.pending) {
      // The authentication state can get stuck in pending if the user refreshes, so just reset it appropriately.
      this.reset();
    }
  },
  computed: {
    ...mapState("authentication", {
      pending: state => state.status == AuthenticationStatus.PENDING,
      expired: state => state.status == AuthenticationStatus.EXPIRED,
      rejected: state => state.status == AuthenticationStatus.REJECTED,
      loggedOut: state => state.status == AuthenticationStatus.LOGGED_OUT,
      unauthenticated: state =>
        state.status == AuthenticationStatus.UNAUTHENTICATED,
      studentType: state => state.type == AuthenticationType.STUDENT,
      educatorType: state => state.type == AuthenticationType.EDUCATOR,
      educatorRegisterType: state =>
        state.type == AuthenticationType.EDUCATOR_REGISTER,
      message: state => state.message
    }),
    ...mapGetters("institution", ["institution"]),
    validateEmail() {
      return (
        this.educators.username.indexOf(this.emailDomain) !== -1 ||
        "Must use your" + this.emailDomain + "email."
      );
    },
    validateConfirmPassword() {
      return (
        this.educators.confirmPassword == this.educators.password ||
        "Must be the same as your password."
      );
    }
  },
  methods: {
    ...mapActions("authentication", ["reset"]),
    authenticateStudents() {
      this.$store.dispatch("authentication/authenticate", this.students);
    },
    authenticateEducators() {
      this.$store.dispatch(
        "authentication/authenticateEducators",
        this.educators
      );
    },
    createEducatorAccount() {
      this.$store.dispatch(
        "authentication/createEducatorAccount",
        this.educators
      );
    }
  },
  subscriptions() {
    const institution$ = this.$observe(() => this.institution);
    return {
      emailDomain: institution$.pipe(
        switchMap(institution => institution.data()),
        map(institution => institution.emailDomain)
      )
    };
  }
};
</script>

<style scoped>
.auth-error {
  margin-top: -6px;
}
</style>
