<template>
  <v-card>
    <v-card-title primary-title class="headline">
      Transcript
  
    </v-card-title>
    <v-card-media>
      <v-expansion-panel>
        <v-expansion-panel-content v-for="(term, index) in terms" :key="term" :value="index === terms.length - 1">
          <v-layout row slot="header" class="header" align-center>
            <v-flex xs7>{{term}}</v-flex>
            <v-flex xs5 class="caption grey--text text-xs-right mr-5">
              <span v-if="transcript.find(t => t.term == term && t.quality)">
                Quarter
                <strong class="grey--text text--darken-2">{{getQuarterGpa(term).toFixed(2)}}</strong> &middot;
              </span>
              <span v-if="transcript.find(t => t.quality)">
                Cumulative
                <strong class="grey--text text--darken-2">{{getCumulativeGpa(term).toFixed(2)}}</strong>
              </span>
            </v-flex>
          </v-layout>
          <v-list two-line dense>
            <v-list-tile v-for="record in transcript.filter(t => t.term == term)" :key="record.course" router to="/search" @click.native="update({query: record.course})">
              <v-list-tile-content avatar class="grey--text text--darken-4">
                <v-list-tile-title>{{record.course}}</v-list-tile-title>
                <v-list-tile-sub-title>
                  <course-name class="grey--text text--darken-2">{{record.course}}</course-name>
                </v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-avatar class="grey--text text--darken-4">
                {{record.quality ? record.gpa.toFixed(1) : record.grade}}
              </v-list-tile-avatar>
            </v-list-tile>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-card-media>
  </v-card>
</template>

<script>
import CourseName from '@/components/CourseName.vue';
import { mapState, mapMutations } from 'vuex';

function mean(x) {
  return x.map(record => record.gpa).reduce((a, b) => a + b, 0) / x.length;
}

export default {
  name: 'transcript',
  components: { CourseName },
  data() {
    return {
      expanded: []
    }
  },
  computed: mapState({
    terms: state => Array.from(new Set(state.transcript.map(record => record.term))),
    transcript: state => state.transcript,
  }),
  methods: {
    ...mapMutations('filter', ['update']),
    getQuarterGpa(term) {
      return mean(this.transcript.filter(record => record.term == term && record.quality));
    },
    getCumulativeGpa(term) {
      const qualityRecords = this.transcript.filter(record => record.quality);
      return mean(qualityRecords.slice(0, qualityRecords.map(record => record.term).lastIndexOf(term)));
    },
  }
}
</script>

<style scoped>
.header {
  width: 100%;
}
</style>
