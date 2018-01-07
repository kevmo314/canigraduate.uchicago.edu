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
            <div class="caption text-xs-center px-3 py-2">
              <strong class="grey--text text--darken-2">Your GPA is bold.</strong> <span class="grey--text">Average GPA is in grey.</span>
            </div>
            <v-expansion-panel focusable>
              <v-expansion-panel-content v-for="(term, index) in terms" :key="term" :value="index === terms.length - 1">
                <div slot="header" class="header display-flex" align-center>
                  {{term}}
                  <div class="flex-grow caption grey--text text-xs-right">
                    <span v-if="transcript.find(t => t.term == term && t.quality)">
                      Quarter
                      <strong class="grey--text text--darken-2">{{quarterGpa[index].toFixed(2)}}</strong>
                      <span v-if="quarterEgpa" class="grey--text">{{quarterEgpa[index].toFixed(2)}}</span>
                      &nbsp;&middot;&nbsp;
                    </span>
                    <span v-if="transcript.find(t => t.quality)">
                      Cumulative
                      <strong class="grey--text text--darken-2">{{cumulativeGpa[index].toFixed(2)}}</strong>
                      <span v-if="cumulativeEgpa" class="grey--text">{{cumulativeEgpa[index].toFixed(2)}}</span>
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
                    <v-list-tile-avatar v-if="record.complete" class="display-flex mr-2 py-3">
                      <span class="grey--text text--darken-4">{{record.quality ? record.gpa.toFixed(1) : record.grade}}</span>
                      <span v-if="record.quality && egpa" class="grey--text ml-2">{{egpa[record.course].toFixed(1)}}</span>
                    </v-list-tile-avatar>
                  </v-list-tile>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-tabs-content>
          <v-tabs-content id="schedule" class="px-3 content">
            <v-select :items="allTerms" :value="scheduleTerm" label="Term" bottom @change="setActiveTerm"
              :disabled="temporaryTerm != null" auto></v-select>
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
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import EventBus from '@/EventBus';

function mean(x) {
  return x.reduce((a, b) => a + b, 0) / x.length;
}

function frequencyMean(x) {
  const count = Object.values(x).reduce((a, b) => a + b, 0);
  const total = Object.keys(x)
    .map(key => parseFloat(key) * x[key])
    .reduce((a, b) => a + b, 0);
  return total / count;
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
    quarterGpa() {
      const quality = this.transcript.filter(record => record.quality);
      const qualityTerms = quality.map(record => record.term);
      return this.terms.map(term => {
        const from = qualityTerms.indexOf(term);
        const to = qualityTerms.lastIndexOf(term) + 1;
        return mean(quality.slice(from, to).map(record => record.gpa));
      });
    },
    cumulativeGpa() {
      const quality = this.transcript.filter(record => record.quality);
      const qualityTerms = quality.map(record => record.term);
      return this.terms.map(term => {
        const to = qualityTerms.lastIndexOf(term) + 1;
        return mean(quality.slice(0, to).map(record => record.gpa));
      });
    },
  },
  data() {
    return { active: null };
  },
  mounted() {
    EventBus.$on('show-schedule-tab', () => (this.active = 'schedule'));
  },
  methods: {
    ...mapActions('filter', ['reset']),
    ...mapMutations('calendar', ['setActiveTerm']),
  },
  subscriptions() {
    const quality = this.$watchAsObservable(() => this.transcript, {
      immediate: true,
    })
      .map(x => x.newValue)
      .map(transcript => transcript.filter(record => record.quality));
    const terms = this.$watchAsObservable(() => this.terms, {
      immediate: true,
    }).map(x => x.newValue);
    const egpa = this.endpoints.gradeDistribution().map(gradeDistribution => {
      return Object.keys(gradeDistribution).reduce(
        (state, key) => ({
          ...state,
          [key]: frequencyMean(gradeDistribution[key]),
        }),
        {},
      );
    });
    return {
      allTerms: this.endpoints.terms().do(terms => {
        if (!this.$store.state.calendar.activeTerm) {
          this.$store.commit('calendar/setActiveTerm', terms[0]);
        }
      }),
      quarterEgpa: Observable.combineLatest(
        quality,
        egpa,
        terms,
      ).map(([quality, egpa, terms]) => {
        const qualityTerms = quality.map(record => record.term);
        const grades = quality.map(record => egpa[record.course]);
        return terms.map(term => {
          const from = qualityTerms.indexOf(term);
          const to = qualityTerms.lastIndexOf(term) + 1;
          return mean(grades.slice(from, to));
        });
      }),
      cumulativeEgpa: Observable.combineLatest(
        quality,
        egpa,
        terms,
      ).map(([quality, egpa, terms]) => {
        const qualityTerms = quality.map(record => record.term);
        const grades = quality.map(record => egpa[record.course]);
        return terms.map(term => {
          return mean(grades.slice(0, qualityTerms.lastIndexOf(term) + 1));
        });
      }),
      egpa,
    };
  },
};
</script>

<style scoped>
.header {
  width: 100%;
}

.content {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.content>>>.header__icon {
  display: none;
}
</style>