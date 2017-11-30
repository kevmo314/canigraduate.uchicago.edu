<template>
  <span :style="{fontStyle: name ? null : 'italic'}">
    {{name || 'Unknown'}}</span>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'course-name',
  computed: mapState('institution', {
    courseInfo: state => state.endpoints.courseInfo,
  }),
  subscriptions() {
    return {
      name: this.$watchAsObservable(() => this.$slots.default[0].text, {
        immediate: true,
      })
        .map(x => x.newValue)
        .filter(x => x.length > 0)
        .flatMap(course => this.courseInfo(course))
        .map(x => x.name),
    };
  },
};
</script>