<template>
  <div v-if="isMetadata" class="ml-2">
    <v-icon class="state-icon mr-2">indeterminate_check_box</v-icon>
    {{lifted.display}}
  </div>
  <v-layout v-else-if="isLeaf && progress.remaining > 0" row align-center class="ml-2 py-1" :class="{'red--text': !prune && this.transcript.length > 0}">
    <v-icon class="state-icon mr-2">check_box_outline_blank</v-icon>
    <div class="id">{{program.split(':')[0]}}</div>
    <course-name class="ml-2" v-if="isExact">{{program}}</course-name>
    <div class="ml-2" v-else>Elective</div>
  </v-layout>
  <v-layout v-else-if="isLeaf" row align-center class="ml-2 py-1 green--text">
    <v-icon class="state-icon mr-2">check_box</v-icon>
    <div class="id">
      {{lifted.satisfier}}
    </div>
    <course-name class="ml-2">{{lifted.satisfier}}</course-name>
  </v-layout>
  <div v-else>
    <div @click="collapse = !collapse"
      class="ml-2 summary body-2 py-1"
      :class="{'collapsed': collapse, 'green--text': isComplete}"
      v-if="program.display">
      <v-icon class="icon mr-2">expand_more</v-icon>{{program.display}}
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
import { mapState } from "vuex";
import CourseName from "@/components/CourseName";
import { Observable } from "rxjs/Observable";

export default {
  name: "requirement",
  components: { CourseName },
  props: {
    lifted: { type: Object, required: true },
    prune: { type: Boolean, required: true }
  },
  data() {
    return { collapse: !this.isLeaf };
  },
  computed: {
    ...mapState("transcript", { transcript: state => state }),
    progress() {
      return {
        completed: 0,
        remaining: 1,
        ...this.lifted.progress
      };
    },
    program() {
      return this.lifted.program;
    },
    isComplete() {
      return this.progress.remaining == 0 && this.progress.completed > 0;
    },
    isLeaf() {
      return typeof this.program === "string";
    },
    isExact() {
      return this.isLeaf && this.program.indexOf(":") == -1;
    },
    isMetadata() {
      return !this.isLeaf && !this.program.requirements;
    },
    isShortened() {
      return this.isShortenedOr || this.isShortenedAll;
    },
    isShortenedAll() {
      return !this.isLeaf && this.program.grouping == "ALL";
    },
    isShortenedOr() {
      return !this.isLeaf && this.program.grouping == "OR";
    }
  }
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
  margin-left: -4px;
  margin-right: 3px;
  margin-top: 12px;
  margin-bottom: 12px;
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
