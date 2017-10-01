<template>
  <v-card>
    <v-card-media>
      <v-tabs centered v-if="root.extensions">
        <v-tabs-bar class="white">
          <v-tabs-slider></v-tabs-slider>
          <v-tabs-item router exact :to="{name: 'catalog', params: {id, extension: null}}">Major</v-tabs-item>
          <v-tabs-item v-for="(extension, name) in root.extensions" :key="name" router :to="{name: 'catalog', params: {id, extension: name}}">
            {{extension.name}}
          </v-tabs-item>
        </v-tabs-bar>
      </v-tabs>
    </v-card-media>
    <v-card-text>
      <div class="subheading">Program requirements</div>
      <requirement v-for="(requirement, index) of program.requirements" :requirement="requirement"
        :key="index"></requirement>
      <div class="metadata">
        <div class="subheading">Meta</div>
        <p v-if="program.metadata.catalog">
          View the
          <a :href="program.metadata.catalog">college catalog page</a>.
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Requirement from '@/components/Requirement';
import { mapState } from 'vuex';

export default {
  components: { Requirement },
  props: {
    id: { type: String, required: true },
    extension: { type: String, required: false }
  },
  computed: {
    ...mapState('transcript', { transcript: state => state }),
    ...mapState('institution', { endpoints: state => state.endpoints }),
  },
  subscriptions() {
    this.$watchAsObservable(() => this.transcript, { immediate: true }).map(x => x.newValue);
    const id = this.$watchAsObservable(() => this.id, { immediate: true }).map(x => x.newValue);
    const extension = this.$watchAsObservable(() => this.extension, { immediate: true }).map(x => x.newValue);
    const root = this.endpoints.programs().combineLatest(id, (programs, id) => programs[id]);
    return {
      root,
      program: root.combineLatest(extension, (root, extension) => {
        return extension ? root.extensions[extension] : root;
      }),
    };
  }
}
</script>
