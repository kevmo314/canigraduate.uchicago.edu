<template>
  <v-card-text>
    <v-slide-x-transition>
      <div v-show="description">
        <p>{{description}}</p>
        <p v-if="notes">
          <completion-indicator>{{notes}}</completion-indicator>
        </p>
        <p v-if="sequence">This course is part of the
          <span class="body-2">{{sequence}}</span> sequence which contains:
          <completion-indicator>{{sequenceCourses.join(', ')}}</completion-indicator>
        </p>
      </div>
    </v-slide-x-transition>
    <v-layout row>
      <v-spacer>
        <template v-if="terms">
          <div v-for="(term, index) of terms.slice(0, maxTerm)" :key="term">
            <div class="display-flex pr-0">
              <div class="subheading term-heading flex-grow">{{term}}</div>
              <div class="caption ml-2 enrolled-heading" v-if="index == 0">
                Enrolled
              </div>
            </div>
            <section-detail :term="term">{{course}}</section-detail>
          </div>
          <div class="text-xs-center" v-if="maxTerm < terms.length">
            <v-btn block flat @click="maxTerm += 1">Show {{terms[maxTerm]}}</v-btn>
          </div>
        </template>
      </v-spacer>
      <div class="side ml-3" v-sticky>
        <div class="subheading">Grades</div>
        <grade-distribution :value="grades"></grade-distribution>
        <div class="subheading mt-2">Meta</div>
      </div>
    </v-layout>
  </v-card-text>
</template>

<script>
import GradeDistribution from '@/components/GradeDistribution';
import CompletionIndicator from '@/components/CompletionIndicator';
import SectionDetail from '@/components/SectionDetail';
import Sticky from '@/directives/Sticky';
import { Observable } from 'rxjs/Observable';
import { mapState } from 'vuex';

export default {
  name: 'course-detail',
  components: { GradeDistribution, SectionDetail, CompletionIndicator },
  directives: { Sticky },
  computed: {
    ...mapState('institution', {
      endpoints: state => state.endpoints,
      converters: state => state.converters,
      periods: state => state.periods,
      grades(state) {
        return state.gpas.map(gpa => ({ gpa, count: this.gradeDistribution[gpa] || 0 }));
      }
    }),
    ...mapState('filter', { filter: state => state }),
    show: {
      get() {
        return this.value || this.$store.state.search.expanded.includes(this.course);
      },
      set(expanded) {
        if (!this.value) {
          this.$store.commit('search/setExpanded', { course: this.course, expanded });
        }
      }
    },
  },
  data() {
    return {
      course: this.$slots.default[0].text,
      maxTerm: 4,
      schedules: {},
    };
  },
  subscriptions() {
    const terms = this.endpoints.terms().first();
    this.$watchAsObservable(() => this.filter, { immediate: true }).map(x => x.newValue)
      .switchMap(
      this.$watchAsObservable()
      )
    const description = this.endpoints.description(this.course);
    const sequence = this.endpoints.courseInfo(this.course).map(data => data && data.sequence).first();
    return {
      description: description.map(data => data && data.description).first(),
      notes: description.map(data => data && data.notes).first(),
      sequence,
      sequenceCourses: sequence.flatMap(sequence => this.endpoints.sequences().map(sequences => sequences[sequence])),
      terms,
      gradeDistribution: Observable.of({}).concat(this.endpoints.gradeDistribution().map(grades => grades[this.course] || {}).first()),
    }
  },
}
</script>

<style scoped>
.title {
  display: flex;
  flex-wrap: nowrap;
  cursor: pointer;
}

.course {
  flex-grow: 1;
  min-width: 0;
  line-height: 1.5;
}

.offering-indicators {
  align-self: flex-start;
  flex-shrink: 0;
}

.side {
  width: 150px;
  top: 75px;
  align-self: flex-start;
}

.term-heading {
  position: relative;
  overflow: hidden;
}

.term-heading:after {
  position: absolute;
  top: 50%;
  width: 100%;
  margin-left: 8px;
  height: 1px;
  content: '\a0';
  background-color: lightgrey;
}

.enrolled-heading {
  align-self: center;
}
</style>