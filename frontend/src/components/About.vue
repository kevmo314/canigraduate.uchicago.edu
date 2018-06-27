<template>
  <div>
    <v-subheader>Updates</v-subheader>
    <v-card>
      <v-card-text>
        <p>Hi there! Thanks for trying out the new <strong>Can I Graduate?</strong>! Ever since UChicago changed its course search system to AIS (Autumn 2016-ish),
        the data model for the old site no longer worked. Since then, the entire data fetching pipeline has been rewritten, and along with it, the site got a new style.
        </p>
        <p>This means that some new features got added! But unfortunately, this also means some features got removed.</p>
        <p>New stuff that got added:
          <ul class="ml-3 mt-2">
            <li>Better performance and shorter loading times</li>
            <li>Material design UI</li>
            <li>More accurate grade distributions</li>
            <li>Degree program change detection</li>
            <li>AIS course data</li>
          </ul>
        </p>
        <p>Stuff that's still planned in descending priority:
          <ol class="ml-3 mt-2">
            <li>Enrollment watches</li>
            <li>All the other degree programs</li>
            <li>Transcript analysis</li>
            <li>Mobile app</li>
            <li>Course evaluation analysis</li>
          </ol>
        </p>
        <p>Stuff from the old site that probably won't make it:
          <ul class="ml-3 mt-2">
            <li>Registering from the course search page</li>
            <li>Textbook search (nobody actually used it lol)</li>
            <li>On-site course evaluations</li>
            <li>Schedule planner</li>
          </ul>
        </p>
        <p>Part of the reason certain features won't make it is because I'm not a current student anymore, so I can't actually register for classes. If you're a current student and would be willing to let me use your account to analyze AIS further, <a href="mailto:kevmo314@gmail.com">email me</a>!</p>
        <p>If you miss one of the above features a lot and think it should be higher priority, or if there's something you'd like to see that's missing, please <a href="mailto:kevmo314@gmail.com">let me know</a>. Not being a student anymore means I rely on student feedback to make this thing useful.</p>
        <p>Hopefully everything will be done by Autumn 2018 but you never know...</p>
      </v-card-text>
    </v-card>
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
        <p>No idea where to start? Email <a href="mailto:kevmo314@gmail.com">kevmo314@gmail.com</a>.</p>
      </v-card-text>
      <v-card-media>
        <v-layout column text-xs-center>
          <v-divider></v-divider>
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
