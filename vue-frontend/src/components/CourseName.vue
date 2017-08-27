<template>
  <span :style="{fontStyle: name ? null : 'italic'}">
    {{name || 'Unknown'}}</span>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'course-name',
  computed: mapState('institution', {
    courseInfo: state => state.endpoints.courseInfo
  }),
  subscriptions() {
    return { name: this.courseInfo(this.$slots.default[0].text).map(x => x.name).first() };
  },
}
</script>