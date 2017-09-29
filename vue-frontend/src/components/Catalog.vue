<template>
  <div>
    <v-subheader>Majors</v-subheader>
    <v-card v-for="(program, name) of majors" :key="name">
      <v-card-title class="body-1" @click="navigateTo(name)">
        {{name}}
      </v-card-title>
      <v-card-text v-if="kebabCase(name) == activeProgram">
        <v-slide-y-transition>
          <program :program="program" />
        </v-slide-y-transition>
      </v-card-text>
    </v-card>
    <v-subheader>Minors</v-subheader>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Program from '@/components/Program';

export default {
  props: { activeProgram: String },
  components: { Program },
  computed: mapState('institution', { endpoints: state => state.endpoints }),
  methods: {
    kebabCase(string) {
      return string.replace(/\s+/g, '-').toLowerCase();
    },
    navigateTo(key) {
      this.$router.push({ name: 'catalog', params: { activeProgram: this.kebabCase(key) } });
    },
  },
  subscriptions() {
    return {
      majors: this.endpoints.majors(),
      minors: this.endpoints.minors(),
    }
  }
}
</script>

<style scoped>

</style>
