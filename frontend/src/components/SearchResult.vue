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
        <v-btn flat color="info" @click.stop="addWatchDialog = !addWatchDialog" v-if="show" disabled>
          <v-icon left>add_alert</v-icon>
          Watches aren't working yet, sorry!
        </v-btn>
        <template v-else>
          <term-offering-indicator v-for="period of periods" :key="period.name" :period="period"
            :course="course" :matches="Array.from(filter.keys()).some(term => term.indexOf(period.name) > -1)"></term-offering-indicator>
        </template>
        <v-dialog v-model="addWatchDialog" max-width="500px">
          <v-card>
            <v-card-title>
              Which term?
            </v-card-title>
            <v-card-text>
              <v-radio-group v-model="radioGroup">
                <v-radio
                  v-for="term in futureTerms"
                  :key="term"
                  :label="term"
                  :value="term"
                ></v-radio>
              </v-radio-group>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" flat @click.stop="dialog2=false">Notify me</v-btn>
              <v-btn flat @click.stop="addWatchDialog = false">Nevermind</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-card-title>
    <v-slide-y-transition>
      <course-detail v-if="show" :filter="filter">{{course}}</course-detail>
    </v-slide-y-transition>
  </v-card>
</template>

<script>
import CourseName from "@/components/CourseName";
import TermOfferingIndicator from "@/components/TermOfferingIndicator";
import { mapState, mapGetters } from "vuex";
import { map, switchMap } from "rxjs/operators";
import { combineLatest } from "rxjs";

export default {
  name: "search-result",
  props: { value: Boolean, filter: Map },
  components: {
    CourseName,
    TermOfferingIndicator,
    CourseDetail: () => import("@/components/CourseDetail")
  },
  computed: {
    ...mapGetters("institution", ["institution"]),
    show: {
      get() {
        return (
          this.value || this.$store.state.search.expanded.includes(this.course)
        );
      },
      set(expanded) {
        if (!this.value) {
          this.$store.commit("search/setExpanded", {
            course: this.course,
            expanded
          });
        }
      }
    }
  },
  methods: {
    addWatch(course) {}
  },
  data() {
    return {
      addWatchDialog: false,
      course: this.$slots.default[0].text,
      maxTerm: 4
    };
  },
  subscriptions() {
    const institution = this.$observe(() => this.institution);
    const course = this.$observe(() => this.course);
    const terms$ = institution.pipe(
      switchMap(institution => institution.index.getTerms())
    );
    const currentTerm$ = institution.pipe(
      switchMap(institution => institution.index.getCurrentTerm())
    );
    const courseTerms$ = this.$observe(() => this.filter).pipe(
      map(filter => new Set(filter.keys()))
    );
    return {
      periods: institution.pipe(
        switchMap(institution => institution.data()),
        map(data => data.periods)
      ),
      crosslists: combineLatest(institution, course).pipe(
        map(([institution, course]) => institution.course(course)),
        switchMap(course => course.data()),
        map(course => course.crosslists.join(", "))
      ),
      futureTerms: combineLatest(terms$, currentTerm$, courseTerms$).pipe(
        map(([terms, currentTerm, courseTerms]) =>
          terms
            .slice(terms.indexOf(currentTerm) + 1)
            .filter(term => courseTerms.has(term))
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
</style>
