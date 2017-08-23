<template>
  <span :style="{fontStyle: name ? null : 'italic'}">
    {{name || 'Unknown'}}</span>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'course-name',
  computed: mapState('institution', {
    courseName: state => state.endpoints.courseName
  }),
  subscriptions() {
    return { name: this.courseName(this.$slots.default[0].text).first() };
  },
}
</script>