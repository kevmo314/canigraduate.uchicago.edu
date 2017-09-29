<template>
  <div>
    <requirement v-for="(requirement, index) of program.requirements" :requirement="requirement"
      :key="index"></requirement>
  </div>
</template>

<script>
import Requirement from '@/components/Requirement';
import { mapState } from 'vuex';

export default {
  name: 'program',
  components: { Requirement },
  props: { program: { type: Object, required: true } },
  computed: mapState('transcript', { transcript: state => state }),
  subscriptions() {
    this.$watchAsObservable(() => this.transcript, { immediate: true }).map(x => x.newValue);
    return {};
  }
}
</script>
