<template>
  <v-card-text>
    <v-slide-x-transition>
      <div v-show="description">
        <p>{{description}}</p>
        <p v-for="note in notes" :key="note">
          <completion-indicator>{{note}}</completion-indicator>
        </p>
        <p v-if="sequence">
          This course is part of the <span class="body-2">{{sequence}}</span> sequence.
        </p>
      </div>
    </v-slide-x-transition>
    <v-layout row>
      <v-spacer>
        <template v-if="terms">
          <term-detail v-for="term of terms" :key="term" :term="term" :course="course" :filter="filter.get(term)" />
        </template>
      </v-spacer>
      <div class="side ml-3" v-sticky>
        <template v-if="grades">
          <div class="subheading">Grades</div>
          <grade-distribution :value="grades"></grade-distribution>
        </template>
        <div class="subheading mt-2">Evaluations</div>
        <small>Maybe coming soon? Depends on if I can figure out how to scrape the data...</small>
      </div>
    </v-layout>
  </v-card-text>
</template>

<script>
import GradeDistribution from "@/components/GradeDistribution";
import CompletionIndicator from "@/components/CompletionIndicator";
import TermDetail from "@/components/TermDetail";
import Sticky from "@/directives/Sticky";
import { combineLatest } from "rxjs";
import { mapGetters } from "vuex";
import { first, map, switchMap } from "rxjs/operators";

export default {
  name: "course-detail",
  components: { GradeDistribution, TermDetail, CompletionIndicator },
  props: { filter: Map },
  directives: { Sticky },
  computed: mapGetters("institution", ["institution"]),
  data() {
    return {
      course: this.$slots.default[0].text,
      schedules: {}
    };
  },
  subscriptions() {
    const course$ = this.$observe(() => this.course);
    const institution$ = this.$observe(() => this.institution);
    const terms$ = combineLatest(
      institution$.pipe(
        map(institution => institution.index),
        switchMap(indexes => indexes.getTerms()),
        map(terms => terms.slice().reverse())
      ),
      this.$observe(() => this.filter).pipe(map(filter => filter.keys()))
    ).pipe(
      map(([allTerms, terms]) => {
        // Order terms by the index in the institution term listing.
        return Array.from(terms).sort(
          (a, b) => allTerms.indexOf(a) - allTerms.indexOf(b)
        );
      })
    );
    const courseData$ = combineLatest(institution$, course$).pipe(
      map(([institution, course]) => institution.course(course)),
      switchMap(course => course.data())
    );
    return {
      description: courseData$.pipe(map(course => course.description)),
      notes: courseData$.pipe(map(course => course.notes)),
      sequence: courseData$.pipe(map(course => course.sequence)),
      terms: terms$,
      grades: combineLatest(
        institution$.pipe(
          switchMap(institution => institution.data()),
          map(data => data.gpas)
        ),
        institution$.pipe(
          switchMap(institution => institution.getGradeDistribution())
        ),
        course$
      ).pipe(
        map(([gpas, grades, course]) =>
          gpas.map(gpa => ({
            gpa,
            count: (grades[course] || {})[gpa] || 0
          }))
        )
      )
    };
  }
};
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
  width: 225px;
  top: 75px;
  align-self: flex-start;
}
</style>
