<template>
  <div>
    <a class="display-flex pr-0 mb-2 black--text" @click="expanded = !expanded">
      <v-icon :class="{'rotated': expanded}">expand_more</v-icon>
      <div class="subheading term-heading flex-grow ml-2">{{term}}</div>
      <v-slide-x-transition>
        <div class="caption ml-2 enrolled-heading" v-if="expanded">
          Enrolled
        </div>
      </v-slide-x-transition>
    </a>
    <v-slide-y-transition>
      <div class="mt-2" @mouseout="clearTemporary" v-if="expanded">
        <section-detail v-for="(section, index) of sections" :key="section" :term="term" :course="course" :section="section" :matches="filter.includes(index)" />
      </div>
    </v-slide-y-transition>
  </div>
</template>

<script>
import SectionDetail from "@/components/SectionDetail";
import { mapActions, mapGetters } from "vuex";
import { combineLatest, of } from "rxjs";
import { switchMap, map, filter, concat, tap } from "rxjs/operators";

export default {
  name: "term-detail",
  components: { SectionDetail },
  props: {
    course: {
      type: String,
      required: true
    },
    term: {
      type: String,
      required: true
    },
    filter: Array,
    expand: Boolean
  },
  data() {
    return { expanded: this.expand };
  },
  computed: mapGetters("institution", ["institution"]),
  subscriptions() {
    const sections$ = combineLatest(
      this.$observe(() => this.institution),
      this.$observe(() => this.course),
      this.$observe(() => this.term)
    ).pipe(
      switchMap(([institution, course, term]) =>
        institution.index.getSections(course, term)
      )
    );
    return { sections: sections$ };
  },
  methods: mapActions("calendar", ["clearTemporary"])
};
</script>

<style scoped>
v-icon {
  transition: transform 0.3s ease-in-out;
}

.rotated {
  transform: rotateZ(-180deg);
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
