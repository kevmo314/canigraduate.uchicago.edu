<template>
  <div v-if="isLeaf" class="display-flex mx-3 my-2">
    <div class="id">
      {{requirement.split(':')[0]}}
    </div>
    <course-name class="ml-2" v-if="isExact">{{requirement}}</course-name>
    <div class="ml-2" v-else>Elective</div>
  </div>
  <div v-else>
    {{requirement.display}}
    <div class="ml-2">
      <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CourseName from '@/components/CourseName';
import { Observable } from 'rxjs/Observable';

export default {
  name: 'requirement',
  components: { CourseName },
  props: ['requirement'],
  computed: {
    ...mapState('institution', { catalogSequence: state => state.endpoints.catalogSequence }),
    isLeaf() {
      return typeof this.requirement != 'object';
    },
    isExact() {
      return this.requirement.indexOf(':') == -1;
    }
  },
}
</script>

<style scoped>

</style>