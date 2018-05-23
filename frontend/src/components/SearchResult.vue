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
          :course="course" :matches="Array.from(filter.keys()).some(term => term.indexOf(period.name) > -1)"></term-offering-indicator>
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
  data() {
    return {
      course: this.$slots.default[0].text,
      maxTerm: 4
    };
  },
  subscriptions() {
    const institution = this.$observe(() => this.institution);
    const course = this.$observe(() => this.course);
    return {
      periods: institution.pipe(
        switchMap(institution => institution.data()),
        map(data => data.periods)
      ),
      crosslists: combineLatest(institution, course, (institution, course) =>
        institution.course(course)
      ).pipe(
        switchMap(course => course.data()),
        map(course => course.crosslists.join(", "))
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
