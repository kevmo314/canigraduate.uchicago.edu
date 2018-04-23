<template>
  <v-card>
    <v-card-media class="white--text" height="300px" src="https://i.ytimg.com/vi/eO6NJuw8yGg/maxresdefault.jpg">
      <v-container fill-height fluid>
        <v-layout fill-height>
          <v-flex xs12 align-end flexbox>
            <span class="headline">Can I Graduate?</span>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card-media>
    <v-card-text>
      <p>Built with love and
        <a href="http://vuejs.org/">Vue.js</a>.</p>
      <p>
        Icons made by
        <a href="https://www.flaticon.com/authors/popcorns-arts" title="Icon Pond">Icon Pond</a> from
        <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> is licensed by
        <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0"
          target="_blank">CC 3.0 BY</a>.</p>
      <p>Additional contributions from:
        <ul>
          <li>Jacob Burroughs</li>
        </ul>
      </p>
      <p>Interested in contributing? Check out our
        <a href="http://github.com/kevmo314/canigraduate.uchicago.edu">GitHub page</a>.</p>
    </v-card-text>
    <v-card-media class="text-xs-center">
      <v-divider></v-divider>
      <p class="mt-2">Copyright © {{year}} Kevin Wang, All Rights Reserved</p>
      <p>This site is not affiliated with {{ institutionName }}</p>
    </v-card-media>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex';
import { flatMap, map } from 'rxjs/operators';
export default {
  data() {
    return { year: new Date().getFullYear() };
  },
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    return {
      institutionName: this.$observe(() => this.institution).pipe(
        flatMap(institution => institution.data()),
        map(data => data.name),
      ),
    };
  },
};
</script>
