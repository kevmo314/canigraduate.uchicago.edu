<template>
  <div v-if="isMetadata">
    Some unknown notes node atm.
  </div>
  <div v-else-if="isLeaf && progress.remaining > 0" class="display-flex py-1" :class="{'red--text': !prune}">
    <div class="id">
      {{requirement.requirement.split(':')[0]}}
    </div>
    <course-name class="ml-2" v-if="isExact">{{requirement.requirement}}</course-name>
    <div class="ml-2" v-else>Elective</div>
  </div>
  <div v-else-if="isLeaf" class="display-flex py-1 green--text">
    <div class="id">
      {{progress.satisfier}}
    </div>
    <course-name class="ml-2">{{progress.satisfier}}</course-name>
  </div>
  <div v-else>
    <div @click="collapse = !collapse"
      class="summary body-2 py-1"
      :class="{'collapsed': collapse, 'green--text': isComplete}"
      v-if="requirement.display">
      <v-icon class="icon">expand_more</v-icon>
      {{requirement.display}}
    </div>
    <v-slide-x-transition>
      <div v-if="!collapse || !requirement.display" :class="{'ml-4': requirement.display}">
        <div v-if="isShortenedOr" class="display-flex">
          <div class="or grey grey--text lighten-1">
            <div class="caption label white">OR</div>
          </div>
          <div class="flex-grow">
            <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
            :progress="progress[index]" :prune="prune || isComplete" />
          </div>
        </div>
        <div v-else-if="isShortenedAll">
          <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
          :progress="progress[index]" :prune="prune || isComplete" />
        </div>
        <div v-else>
          <requirement v-for="(child, index) of requirement.requirements" :key="index" :requirement="child"
          :progress="progress[index]" :prune="prune || isComplete" />
        </div>
      </div>
    </v-slide-x-transition>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CourseName from '@/components/CourseName';
import { Observable } from 'rxjs/Observable';

export default {
  name: 'requirement',
  components: { CourseName },
  props: {
    requirement: { type: Object, required: true },
    progress: {
      type: [Object, Array],
      required: false,
      default() {
        // Return an unsatisfiable node.
        return { completed: 0, remaining: 1 };
      },
    },
    prune: { type: Boolean, required: true },
  },
  data() {
    return {
      collapse: !this.isLeaf && this.requirement.collapse,
    };
  },
  computed: {
    isComplete() {
      return Boolean(this.progress) && this.progress.remaining == 0;
    },
    isLeaf() {
      return !this.requirement.requirements;
    },
    isExact() {
      return this.isLeaf && this.requirement.requirement.indexOf(':') == -1;
    },
    isMetadata() {
      return this.isLeaf && !this.requirement.requirement;
    },
    isShortened() {
      return this.isShortenedOr || this.isShortenedAll;
    },
    isShortenedAll() {
      return !this.isLeaf && this.requirement.grouping == 'ALL';
    },
    isShortenedOr() {
      return !this.isLeaf && this.requirement.grouping == 'OR';
    },
  },
};
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