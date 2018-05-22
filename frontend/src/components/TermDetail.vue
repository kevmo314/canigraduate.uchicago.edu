<template>
  <div class="mt-2" @mouseout="clearTemporary">
    <section-detail v-for="(section, index) of sections" :key="section" :term="term" :course="course" :section="section" :matches="filter.includes(index)" />
  </div>
</template>

<script>
import SectionDetail from '@/components/SectionDetail';
import { mapActions, mapGetters } from 'vuex';
import { combineLatest, of } from 'rxjs';
import { switchMap, map, filter, concat } from 'rxjs/operators';

export default {
  name: 'term-detail',
  components: { SectionDetail },
  props: {
    course: {
      type: String,
      required: true,
    },
    term: {
      type: String,
      required: true,
    },
    filter: Array,
  },
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    const sections$ = combineLatest(
      this.$observe(() => this.institution).pipe(
        switchMap(institution => institution.getIndexes()),
      ),
      this.$observe(() => this.course),
      this.$observe(() => this.term),
    ).pipe(map(([index, course, term]) => index.getSections(course, term)));
    return { sections: sections$ };
  },
  methods: mapActions('calendar', ['clearTemporary']),
};
</script>
