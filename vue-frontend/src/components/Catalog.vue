<template>
  <div>
    <v-subheader>Majors</v-subheader>
    <v-card v-for="(program, name) of majors" :key="name" v-scroll="kebabCase(name) == activeProgram">
      <v-card-title class="body-1" @click="navigateTo(name)">
        {{name}}
      </v-card-title>
      <v-card-text v-if="kebabCase(name) == activeProgram" transition="slide-y-transition"
        class="display-flex">
        <div class="flex-grow">
          <div class="subheading">Program requirements</div>
          <program :program="program"></program>
        </div>
        <div class="metadata">
          <div class="subheading">Meta</div>
          <p v-if="program.metadata.catalog">
            View the
            <a :href="program.metadata.catalog">college catalog page</a>.
          </p>
        </div>
      </v-card-text>
    </v-card>
    <v-subheader>Minors</v-subheader>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Program from '@/components/Program';
import Scroll from '@/directives/Scroll';

export default {
  props: { activeProgram: String },
  components: { Program },
  directives: { Scroll },
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
.metadata {
  flex: 0 0 240px;
}
</style>
