<template>
  <span :style="{fontStyle: name ? null : 'italic'}" class="name" :class="{'unresolved': name === undefined}">
    {{name || 'Unknown'}}</span>
</template>

<script>
import { mapGetters } from "vuex";
import {
  map,
  switchMap,
  filter,
  publishReplay,
  refCount
} from "rxjs/operators";
import { combineLatest } from "rxjs";

export default {
  name: "course-name",
  computed: mapGetters("institution", ["institution"]),
  subscriptions() {
    return {
      name: combineLatest(
        this.$observe(() => this.institution),
        this.$observe(() => this.$slots.default[0].text).pipe(
          filter(x => x.length > 0)
        )
      ).pipe(
        map(([institution, course]) => institution.course(course)),
        switchMap(course => course.data()),
        map(data => data && data.name)
      )
    };
  }
};
</script>

<style scoped>
.name {
  transition: opacity 0.3s ease-in;
}

.unresolved {
  opacity: 0;
}
</style>