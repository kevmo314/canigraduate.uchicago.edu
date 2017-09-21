<template>
  <div>
    <v-subheader>Majors</v-subheader>
    <program v-for="(program, name) of majors" :key="name" :program="program">{{name}}</program>
    <v-subheader>Minors</v-subheader>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Program from '@/components/Program';

export default {
  components: { Program },
  computed: mapState('institution', { endpoints: state => state.endpoints }),
  subscriptions() {
    return {
      majors: this.endpoints.majors(),
      minors: this.endpoints.minors()
    }
  }
}
</script>

<style scoped>

</style>
