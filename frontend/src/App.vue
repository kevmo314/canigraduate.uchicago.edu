<template>
  <v-app>
    <v-navigation-drawer app fixed enable-resize-watcher v-model="drawer">
      <v-toolbar flat class="transparent">
        <v-list class="pa-0">
          <v-list-tile avatar tag="div">
            <v-list-tile-avatar>
              <img src="//communications.uchicago.edu/sites/all/files/identity/downloads/university-seal/university.seal.rgb.maroon.png">
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ institutionName }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-toolbar>
      <v-list class="pt-0">
        <template v-if="authenticated">
          <v-divider></v-divider>
          <v-subheader class="body-2 user-subheader mt-2">
            <div class="single-line">{{user.displayName}}</div>
          </v-subheader>
          <v-subheader class="body-1 user-subheader mb-2">{{user.email}} </v-subheader>
        </template>
        <v-divider></v-divider>
        <v-list-group no-action>
          <v-list-tile slot="activator">
            <v-list-tile-action>
              <v-icon>library_books</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>Degree Programs</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile v-for="program in programs" :key="program" router :to="{name: 'catalog', params: {program}}">
            <v-list-tile-content>
              <v-list-tile-title class="d-flex">
                {{program}}
                <program-progress :program="program" />
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list-group>
        <v-list-tile router to="/search">
          <v-list-tile-action>
            <v-icon>search</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Course Search</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile router to="/watches" :disabled="!authenticated">
          <v-list-tile-action>
            <v-icon>timer</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Enrollment Watches</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile router to="/analytics">
          <v-list-tile-action>
            <v-icon>multiline_chart</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Analytics</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile router to="/about">
          <v-list-tile-action>
            <v-icon>info</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>About</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-divider v-if="authenticated || educatorAuthenticated"></v-divider>
        <v-list-tile v-if="authenticated || educatorAuthenticated" @click="signOut">
          <v-list-tile-action>
            <v-icon>exit_to_app</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Sign Out</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar flat fixed class="indigo darken-4" dark app>
      <v-toolbar-side-icon @click.stop="drawer = !drawer" v-if="$vuetify.breakpoint.mdAndDown"></v-toolbar-side-icon>
      <v-toolbar-title>{{title || 'Can I Graduate?'}}</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid class="display-flex">
        <div class="flex-grow">
          <v-slide-y-reverse-transition>
            <router-view></router-view>
          </v-slide-y-reverse-transition>
        </div>
        <div class="sidebar ml-3" v-if="!educatorAuthenticated">
          <div v-sticky>
            <authentication v-if="!authenticated">
            </authentication>
            <sidebar v-else></sidebar>
          </div>
        </div>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import Authentication from '@/components/Authentication.vue';
import Sidebar from '@/components/Sidebar.vue';
import ProgramProgress from '@/components/ProgramProgress.vue';
import { AuthenticationStatus } from '@/store/modules/authentication';
import { mapState, mapActions, mapGetters } from 'vuex';
import EventBus from '@/EventBus';
import Sticky from '@/directives/Sticky';
import { switchMap, map, tap } from 'rxjs/operators';

export default {
  name: 'app',
  components: { Authentication, Sidebar, ProgramProgress },
  directives: { Sticky },
  computed: {
    ...mapState('authentication', {
      authenticated: state =>
        state.status == AuthenticationStatus.AUTHENTICATED,
      educatorAuthenticated: state =>
        state.status == AuthenticationStatus.EDUCATOR_AUTHENTICATED,
      user: state => state.data,
    }),
    ...mapGetters('institution', ['institution']),
  },
  data() {
    return { drawer: !this.$vuetify.breakpoint.mdAndDown, title: null };
  },
  mounted() {
    EventBus.$on('set-title', title => (this.title = title));
  },
  methods: {
    signOut() {
      this.$store.dispatch(
        'authentication/reset',
        AuthenticationStatus.LOGGED_OUT,
      );
    },
  },
  subscriptions() {
    const institution$ = this.$observe(() => this.institution);
    return {
      programs: institution$.pipe(
        switchMap(institution => institution.programs),
      ),
      institutionName: institution$.pipe(
        switchMap(institution => institution.data()),
        map(institution => institution.name),
      ),
    };
  },
};
</script>

<style scoped>
.content {
  flex-grow: 1;
  margin-right: 16px;
}

.sidebar {
  flex: 0 0 480px;
}

.user-subheader {
  height: 24px;
}
</style>

<style>
.single-line {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.display-flex {
  display: flex;
}

.display-flex > * {
  min-width: 0;
}

.flex-grow {
  flex-grow: 1;
}

.morning {
  background-color: #8bc34a !important;
  fill: #8bc34a;
}

.noon {
  background-color: #03a9f4 !important;
  fill: #03a9f4;
}

.afternoon {
  background-color: #ffeb3b !important;
  fill: #ffeb3b;
}

.evening {
  background-color: #ff9800 !important;
  fill: #ff9800;
}
</style>

