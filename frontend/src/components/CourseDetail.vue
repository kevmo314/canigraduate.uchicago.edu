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
          <div v-for="(term, index) of terms.slice(0, maxTerm)" :key="term">
            <div class="display-flex pr-0">
              <div class="subheading term-heading flex-grow">{{term}}</div>
              <div class="caption ml-2 enrolled-heading" v-if="index == 0">
                Enrolled
              </div>
            </div>
            <term-detail :filter="filter.get(term)" :course="course" :term="term" />
          </div>
          <div class="text-xs-center" v-if="maxTerm < terms.length">
            <v-btn block flat @click="maxTerm += 1">Show {{terms[maxTerm]}}</v-btn>
          </div>
        </template>
      </v-spacer>
      <div class="side ml-3" v-sticky>
        <template v-if="grades">
          <div class="subheading">Grades</div>
          <grade-distribution :value="grades"></grade-distribution>
        </template>
        <div class="subheading mt-2">Meta</div>
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
      maxTerm: 4,
      schedules: {}
    };
  },
  subscriptions() {
    const course$ = this.$observe(() => this.course);
    const institution$ = this.$observe(() => this.institution);
    const terms$ = combineLatest(
      institution$.pipe(
        switchMap(institution => institution.getIndexes()),
        map(indexes => indexes.getTerms()),
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
  content: "\a0";
  background-color: lightgrey;
}

.enrolled-heading {
  align-self: center;
}
</style>
