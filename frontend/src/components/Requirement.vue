<template>
  <div v-if="isMetadata">
    Some unknown notes node atm.
  </div>
  <div v-else-if="isLeaf && progress.remaining > 0" class="display-flex py-1" :class="{'red--text': !prune}">
    <v-icon class="state-icon">check_box_outline_blank</v-icon>
    <div class="id">{{program.split(':')[0]}}</div>
    <course-name class="ml-2" v-if="isExact">{{program}}</course-name>
    <div class="ml-2" v-else>Elective</div>
  </div>
  <div v-else-if="isLeaf" class="display-flex py-1 green--text">
    <v-icon class="state-icon">check_box</v-icon>
    <div class="id">
      {{lifted.satisfier}}
    </div>
    <course-name class="ml-2">{{lifted.satisfier}}</course-name>
  </div>
  <div v-else>
    <div @click="collapse = !collapse"
      class="summary body-2 py-1"
      :class="{'collapsed': collapse, 'green--text': isComplete}"
      v-if="program.display">
      <v-icon class="icon" v-if="lifted.requirements">expand_more</v-icon>
      <v-icon class="state-icon" v-else>indeterminate_check_box</v-icon>
      {{program.display}}
    </div>
    <v-slide-x-transition>
      <div v-if="!collapse || !program.display" :class="{'ml-4': program.display}">
        <div v-if="isShortenedOr" class="display-flex">
          <div class="or grey grey--text lighten-1">
            <div class="caption label white">OR</div>
          </div>
          <div class="flex-grow">
            <requirement v-for="(child, index) of lifted.requirements" :key="index" :lifted="child" :prune="prune || isComplete" />
          </div>
        </div>
        <div v-else-if="isShortenedAll">
          <requirement v-for="(child, index) of lifted.requirements" :key="index" :lifted="child" :prune="prune || isComplete" />
        </div>
        <div v-else>
          <requirement v-for="(child, index) of lifted.requirements" :key="index" :lifted="child" :prune="prune || isComplete" />
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
    lifted: { type: Object, required: true },
    prune: { type: Boolean, required: true },
  },
  data() {
    return { collapse: !this.isLeaf };
  },
  computed: {
    progress() {
      return Object.assign(
        { completed: 0, remaining: 1 },
        this.lifted.progress,
      );
    },
    program() {
      return this.lifted.program;
    },
    isComplete() {
      return this.progress.remaining == 0 && this.progress.completed > 0;
    },
    isLeaf() {
      return typeof this.program === 'string';
    },
    isExact() {
      return this.isLeaf && this.program.indexOf(':') == -1;
    },
    isMetadata() {
      return this.isLeaf && !this.program;
    },
    isShortened() {
      return this.isShortenedOr || this.isShortenedAll;
    },
    isShortenedAll() {
      return !this.isLeaf && this.program.grouping == 'ALL';
    },
    isShortenedOr() {
      return !this.isLeaf && this.program.grouping == 'OR';
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

.summary.collapsed .warning-icon {
  transform: none;
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