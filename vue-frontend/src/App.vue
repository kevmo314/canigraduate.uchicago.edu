<template>
  <v-app toolbar footer v-resize="onResize">
    <v-navigation-drawer fixed :temporary="deviceWidth < 1600" :persistent="deviceWidth >= 1600"
      light v-model="drawer">
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
        <v-list-tile router to="/catalog">
          <v-list-tile-action>
            <v-icon>library_books</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>College Catalog</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
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
        <v-divider v-if="authenticated"></v-divider>
        <v-list-tile v-if="authenticated" @click="signOut">
          <v-list-tile-action>
            <v-icon>exit_to_app</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Sign Out</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar fixed class="indigo darken-4" dark>
      <v-toolbar-side-icon @click.stop="drawer = !drawer" v-if="deviceWidth < 1600"></v-toolbar-side-icon>
      <v-toolbar-title>Can I Graduate?</v-toolbar-title>
    </v-toolbar>
    <main>
      <v-container fluid class="display-flex">
        <div class="flex-grow">
          <v-slide-y-reverse-transition>
            <router-view></router-view>
          </v-slide-y-reverse-transition>
        </div>
        <div class="sidebar ml-3" v-sticky>
          <authentication v-if="!authenticated">
          </authentication>
          <sidebar v-else></sidebar>
        </div>
      </v-container>
    </main>
    <v-footer class="indigo darken-4">
      <span class="white--text">The data presented is not guaranteed to be correct. Periodically verify your
        requirements with your academic advisor prior to graduation.</span>
    </v-footer>
  </v-app>
</template>

<script>
import Authentication from '@/components/Authentication.vue'
import Sidebar from '@/components/Sidebar.vue'
import { AuthenticationStatus } from '@/store/modules/authentication'
import { mapState, mapActions } from 'vuex'
import Sticky from '@/directives/Sticky';

export default {
  name: 'app',
  components: { Authentication, Sidebar },
  directives: { Sticky },
  computed: {
    ...mapState('authentication', {
      authenticated: state => state.status == AuthenticationStatus.AUTHENTICATED,
      user: state => state.data,
    }),
    ...mapState('institution', {
      institutionName: state => state.name,
    }),
  },
  data() {
    const deviceWidth = document.documentElement.clientWidth;
    return { drawer: deviceWidth >= 1600, deviceWidth }
  },
  methods: {
    onResize() {
      this.deviceWidth = document.documentElement.clientWidth
      this.drawer = this.deviceWidth >= 1600;
    },
    signOut() {
      this.$store.dispatch('authentication/reset', AuthenticationStatus.LOGGED_OUT);
    }
  }
}
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

.flex-grow {
  flex-grow: 1;
}

.morning {
  background-color: #8BC34A !important;
  fill: #8BC34A;
}

.noon {
  background-color: #03A9F4 !important;
  fill: #03A9F4;
}

.afternoon {
  background-color: #FFEB3B !important;
  fill: #FFEB3B;
}

.evening {
  background-color: #FF9800 !important;
  fill: #FF9800;
}
</style>

<style lang="stylus">
@require './main'
</style>
