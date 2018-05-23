<template>
  <div>
    <v-subheader>About</v-subheader>
    <v-card>
      <v-card-text>
        <p>Built with love and
          <a href="http://vuejs.org/">Vue.js</a>.</p>
        <p>Additional contributions from:
          <ul class="ml-3 mt-2">
            <li>Jacob Burroughs</li>
            <li>Kelly Shen</li>
            <li>Caitlin Yee</li>
          </ul>
        </p>
        <p>Interested in contributing? Tired of seeing stuff unfinished? Check out our
          <a href="http://github.com/kevmo314/canigraduate.uchicago.edu">GitHub page</a> and contribute!</p>
        <p>No idea where to start? Email Kevin at <a href="mailto:kevmo314@gmail.com">kevmo314@gmail.com</a>.</p>
      </v-card-text>
      <v-card-media>
        <v-layout column text-xs-center>
          <v-divider></v-divider>
          <div class="my-2">This site is not affiliated with {{ institutionName }}</div>
          <div class="my-2">©{{year}} — <strong>Can I Graduate?</strong></div>
        </v-layout>
      </v-card-media>
    </v-card>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { switchMap, map } from "rxjs/operators";
export default {
  data() {
    return { year: new Date().getFullYear() };
  },
  computed: mapGetters("institution", ["institution"]),
  subscriptions() {
    return {
      institutionName: this.$observe(() => this.institution).pipe(
        switchMap(institution => institution.data()),
        map(data => data.name)
      )
    };
  }
};
</script>
