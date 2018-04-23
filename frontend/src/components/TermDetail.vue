<template>
  <div class="mt-2" @mouseout="clearTemporary">
    <section-detail v-for="section of sections" :key="section" :term="term" :course="course" :section="section" :serialized="serialized" />
  </div>
</template>

<script>
import SectionDetail from '@/components/SectionDetail';
import { mapActions, mapGetters } from 'vuex';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { flatMap, map } from 'rxjs/operators';

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
    serialized: Object,
  },
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    return {
      sections: combineLatest(
        this.$observe(() => this.institution),
        this.$observe(() => this.course),
        this.$observe(() => this.term),
        (institution, course, term) =>
          this.institution.course(course).term(term),
      ).pipe(flatMap(term => term.sections)),
    };
  },
  methods: mapActions('calendar', ['clearTemporary']),
};
</script>
