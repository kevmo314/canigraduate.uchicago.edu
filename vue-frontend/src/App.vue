<template>
  <v-app toolbar footer>
    <v-navigation-drawer fixed persistent light v-model="drawer" overflow>
      <v-toolbar flat class="transparent">
        <v-list class="pa-0">
          <v-list-tile avatar tag="div">
            <v-list-tile-avatar class="logo">
              <img src="//communications.uchicago.edu/sites/all/files/identity/downloads/university-seal/university.seal.rgb.maroon.png">
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ institutionName }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-toolbar>
      <v-list class="pt-0">
        <template v-if="loggedIn">
          <v-divider></v-divider>
          <v-subheader>Signed in as {{email}}</v-subheader>
        </template>
        <v-divider></v-divider>
        <v-list-tile router to="/">
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
        <v-list-tile router to="/watches" :disabled="!loggedIn">
          <v-list-tile-action>
            <v-icon>timer</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Enrollment Watches</v-list-tile-title>
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
        <v-divider v-if="loggedIn"></v-divider>
        <v-list-tile v-if="loggedIn" @click="$store.dispatch('authentication/reset')">
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
      <v-toolbar-side-icon class="hidden-md-and-up" @click.native.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title>Can I Graduate?</v-toolbar-title>
    </v-toolbar>
    <main>
      <v-container fluid>
        <v-layout row>
          <div class="content">
            <router-view></router-view>
          </div>
          <sidebar class="sidebar"></sidebar>
        </v-layout>
      </v-container>
    </main>
    <v-footer class="indigo darken-4">
      <span class="white--text">The data presented is not guaranteed to be correct. Periodically verify your requirements with your academic advisor prior to graduation.</span>
    </v-footer>
  </v-app>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue'
import { AuthenticationStatus } from '@/store/modules/authentication'
import { mapState } from 'vuex'

export default {
  name: 'app',
  components: { Sidebar },
  computed: {
    ...mapState('authentication', {
      loggedIn: state => state.status == AuthenticationStatus.AUTHENTICATED,
      email: state => state.data.email,
    }),
    ...mapState('institution', {
      institutionName: state => state.name,
    }),
  },
  data() {
    return { drawer: true }
  },
}
</script>

<style scoped>
.content {
  flex-grow: 1;
  margin-right: 16px;
}

.sidebar {
  flex: 0 0 540px;
}
</style>

<style>
.single-line {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
</style>