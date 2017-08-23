<template>
  <v-card>
    <v-card-title @click="show = !show" class="title py-2">
      <div class="course pr-2">
        <div class="subheading grey--text text--darken-4 single-line">{{course}}
          <span class="grey--text caption">{{crosslists}}</span>
        </div>
        <div class="body-1 grey--text text--darken-2 single-line">
          <course-name>{{course}}</course-name>
        </div>
      </div>
      <div class="offering-indicators">
        <term-offering-indicator v-for="period of periods" :key="period.name" :period="period"
          :course="course"></term-offering-indicator>
      </div>
    </v-card-title>
    <v-slide-y-transition>
      <course-detail v-if="show">{{course}}</course-detail>
    </v-slide-y-transition>
  </v-card>
</template>

<script>
import CourseName from '@/components/CourseName';
import TermOfferingIndicator from '@/components/TermOfferingIndicator';
import { Observable } from 'rxjs/Observable';
import { mapState } from 'vuex';

export default {
  name: 'search-result',
  props: { value: Boolean },
  components: { CourseName, TermOfferingIndicator, CourseDetail: () => import('@/components/CourseDetail') },
  computed: {
    ...mapState('institution', {
      endpoints: state => state.endpoints,
      converters: state => state.converters,
      periods: state => state.periods,
      grades(state) {
        return state.gpas.map(gpa => ({ gpa, count: this.gradeDistribution[gpa] || 0 }));
      }
    }),
    ...mapState('filter', {
      activePeriods(state) {
        return state.periods.filter(i => i < this.periods.length).map(i => this.periods[i].name)
      }
    }),
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
    filteredOfferings() {
      return this.offerings.filter(term => this.activePeriods.includes(this.converters.termToPeriod(term).name));
    },
  },
  data() {
    return {
      course: this.$slots.default[0].text,
      maxTerm: 4,
    };
  },
  subscriptions() {
    return {
      crosslists: this.endpoints.crosslists(this.course).map(identifiers => identifiers.join(', ')).first(),
      description: this.endpoints.description(this.course).first(),
      offerings: Observable.of([]).concat(this.endpoints.offerings(this.course).first()),
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
</style>