<template>
  <span :style="{fontStyle: name ? null : 'italic'}">
    {{name || 'Unknown'}}</span>
</template>

<script>
import { mapGetters } from "vuex";
import { map, switchMap, filter } from "rxjs/operators";
import models from "@/models";
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
        map(data => data.name)
      )
    };
  }
};
</script>
