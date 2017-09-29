<template>
  <div v-if="isLeaf" class="display-flex my-2">
    <div class="id">
      {{requirement.split(':')[0]}}
    </div>
    <course-name class="ml-2" v-if="isExact">{{requirement}}</course-name>
    <div class="ml-2" v-else>Elective</div>
  </div>
  <div v-else>
    <span @click="collapse = !collapse">{{requirement.display}}</span>
    <div class="ml-2 mt-2" v-if="!collapse">
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
  data() {
    return { collapse: !this.isLeaf && this.requirement.collapse };
  },
  computed: {
    ...mapState('institution', { catalogSequence: state => state.endpoints.catalogSequence }),
    isLeaf() {
      return typeof this.requirement != 'object';
    },
    isExact() {
      return this.requirement.indexOf(':') == -1;
    },
  },
}
</script>
