<template>
  <div v-if="isLeaf">
    {{requirement}}
  </div>
  <div class="ml-2" v-else>
    <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { Observable } from 'rxjs/Observable';

export default {
  name: 'requirement',
  props: ['requirement'],
  computed: {
    ...mapState('institution', { catalogSequence: state => state.endpoints.catalogSequence }),
    isLeaf() {
      return typeof this.requirement != 'object';
    }
  },
}
</script>