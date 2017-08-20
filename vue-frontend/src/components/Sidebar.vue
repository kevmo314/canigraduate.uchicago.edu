<template>
  <v-card>
    <v-card-media>
      <v-tabs grow>
        <v-tabs-bar slot="activators" class="white">
          <v-tabs-slider class="blue"></v-tabs-slider>
          <v-tabs-item href="#transcript">Transcript</v-tabs-item>
          <v-tabs-item href="#schedule">Schedule</v-tabs-item>
        </v-tabs-bar>
        <v-tabs-content id="transcript">
          <v-expansion-panel>
            <v-expansion-panel-content v-for="(term, index) in terms" :key="term" :value="index === terms.length - 1">
              <div slot="header" class="header flex" align-center>
                {{term}}
                <div class="grow caption grey--text text-xs-right mr-5">
                  <span v-if="transcript.find(t => t.term == term && t.quality)">
                    Quarter
                    <strong class="grey--text text--darken-2">{{getQuarterGpa(term).toFixed(2)}}</strong>&nbsp;&middot;&nbsp;
                  </span>
                  <span v-if="transcript.find(t => t.quality)">
                    Cumulative
                    <strong class="grey--text text--darken-2">{{getCumulativeGpa(term).toFixed(2)}}</strong>
                  </span>
                </div>
              </div>
              <v-list two-line dense>
                <v-list-tile v-for="record in transcript.filter(t => t.term == term)" :key="record.course"
                  router to="/search" @click.native="reset({query: record.course})">
                  <v-list-tile-content avatar class="grey--text text--darken-4">
                    <v-list-tile-title>{{record.course}}</v-list-tile-title>
                    <v-list-tile-sub-title>
                      <course-name class="grey--text text--darken-2">{{record.course}}</course-name>
                    </v-list-tile-sub-title>
                  </v-list-tile-content>
                  <v-list-tile-avatar class="grey--text text--darken-4" v-if="record.complete">
                    {{record.quality ? record.gpa.toFixed(1) : record.grade}}
                  </v-list-tile-avatar>
                </v-list-tile>
              </v-list>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-tabs-content>
        <v-tabs-content id="schedule" class="px-3">
          <v-select
            :items="allTerms"
            v-model="scheduleTerm"
            label="Term"
            bottom
            hide-details
          ></v-select>
          <calendar :records="transcript.filter(record => record.term == scheduleTerm)" :term="scheduleTerm" />
        </v-tabs-content>
      </v-tabs>
    </v-card-media>
  </v-card>
</template>

<script>
import CourseName from '@/components/CourseName.vue';
import Calendar from '@/components/Calendar.vue';
import { mapState, mapActions } from 'vuex';

function mean(x) {
  return x.map(record => record.gpa).reduce((a, b) => a + b, 0) / x.length;
}

export default {
  name: 'sidebar',
  components: { CourseName, Calendar },
  computed: {
    ...mapState('transcript', {
      terms: state => Array.from(new Set(state.map(record => record.term))),
      transcript: state => state,
    }),
    ...mapState('institution', {
      endpoints: state => state.endpoints,
    }),
    scheduleTerm: {
      get() {
        return this.$store.state.calendar.activeTerm;
      },
      set(term) {
        this.$store.commit('calendar/setActiveTerm', term);
      }
    }
  },
  methods: {
    ...mapActions('filter', ['reset']),
    getQuarterGpa(term) {
      return mean(this.transcript.filter(record => record.term == term && record.quality));
    },
    getCumulativeGpa(term) {
      const qualityRecords = this.transcript.filter(record => record.quality);
      return mean(qualityRecords.slice(0, qualityRecords.map(record => record.term).lastIndexOf(term)));
    },
  },
  subscriptions() {
    return {
      allTerms: this.endpoints.terms().do(terms => {
        if(!this.$store.state.calendar.activeTerm) {
      this.$store.commit('calendar/setActiveTerm', term);
        }
      })
    }
  }
}
</script>

<style scoped>
.header {
  width: 100%;
}
</style>
