<template>
  <v-card>
    <v-card-media>
      <v-tabs grow v-model="active">
        <v-tabs-bar class="white">
          <v-tabs-slider class="blue"></v-tabs-slider>
          <v-tabs-item href="#transcript">Transcript</v-tabs-item>
          <v-tabs-item href="#schedule">Schedule</v-tabs-item>
        </v-tabs-bar>
        <v-tabs-items>
          <v-tabs-content id="transcript" class="content">
            <v-expansion-panel focusable>
              <v-expansion-panel-content v-for="(term, index) in terms" :key="term" :value="index === terms.length - 1">
                <div slot="header" class="header display-flex" align-center>
                  {{term}}
                  <div class="flex-grow caption grey--text text-xs-right mr-3">
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
                        <course-name>{{record.course}}</course-name>
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
          <v-tabs-content id="schedule" class="px-3 content">
            <v-select :items="allTerms" :value="scheduleTerm" label="Term" bottom @change="setActiveTerm"
              :disabled="temporaryTerm != null"></v-select>
            <calendar :records="transcript.filter(record => record.term == scheduleTerm)" :term="scheduleTerm"
            />
          </v-tabs-content>
        </v-tabs-items>
      </v-tabs>
    </v-card-media>
  </v-card>
</template>

<script>
import CourseName from '@/components/CourseName.vue';
import Calendar from '@/components/Calendar.vue';
import { mapState, mapActions, mapMutations } from 'vuex';
import EventBus from '@/EventBus';

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
    ...mapState('calendar', {
      activeTerm: state => state.activeTerm,
      temporaryTerm: state => state.temporary.term,
      scheduleTerm: state => state.temporary.term || state.activeTerm,
    }),
  },
  data() {
    return { active: null }
  },
  mounted() {
    EventBus.$on('show-schedule-tab', () => this.active = 'schedule')
  },
  methods: {
    ...mapActions('filter', ['reset']),
    ...mapMutations('calendar', ['setActiveTerm']),
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
        if (!this.$store.state.calendar.activeTerm) {
          this.$store.commit('calendar/setActiveTerm', terms[0]);
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

.content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
