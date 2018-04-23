<template>
  <span :style="{fontStyle: name ? null : 'italic'}">
    {{name || 'Unknown'}}</span>
</template>

<script>
import { mapGetters } from 'vuex';
import { map, flatMap } from 'rxjs/operators';
import models from '@/models';
import { combineLatest } from 'rxjs/observable/combineLatest';

export default {
  name: 'course-name',
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    return {
      name: combineLatest(
        this.$observe(() => this.institution),
        this.$observe(() => this.$slots.default[0].text).filter(
          x => x.length > 0,
        ),
        (institution, course) => institution.course(course),
      ).pipe(flatMap(course => course.data()), map(data => data.name)),
    };
  },
};
</script>