<template>
  <div v-if="isLeaf" class="display-flex py-1">
    <div class="id">
      {{requirement.split(':')[0]}}
    </div>
    <course-name class="ml-2" v-if="isExact">{{requirement}}</course-name>
    <div class="ml-2" v-else>Elective</div>
  </div>
  <div v-else-if="!isShortened">
    <div @click="collapse = !collapse" class="summary body-2 py-1" :class="{'collapsed': collapse}">
      <v-icon class="icon">expand_more</v-icon>
      {{requirement.display}}
    </div>
    <v-slide-x-transition>
      <div class="ml-4" v-if="!collapse">
        <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
        />
      </div>
    </v-slide-x-transition>
  </div>
  <div v-else-if="isShortenedOr" class="display-flex">
    <div class="or grey grey--text lighten-1">
      <div class="caption label white">OR</div>
    </div>
    <div class="flex-grow">
      <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
      />
    </div>
  </div>
  <div v-else-if="isShortenedAll">
    <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
    />
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
    isShortened() {
      return this.isShortenedOr || this.isShortenedAll;
    },
    isShortenedAll() {
      return !this.isLeaf && this.requirement.display == 'ALL';
    },
    isShortenedOr() {
      return !this.isLeaf && this.requirement.display == 'OR';
    },
  },
}
</script>

<style scoped>
.summary {
  cursor: pointer;
}

.summary.collapsed .icon {
  transform: rotate(-90deg);
}

.icon {
  transition: transform 0.2s ease-in-out;
}

.or {
  flex: 0 0 1px;
  margin: 12px 12px 12px 11px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
}

.or .label {
  padding: 2px;
  text-transform: lowercase;
}
</style>