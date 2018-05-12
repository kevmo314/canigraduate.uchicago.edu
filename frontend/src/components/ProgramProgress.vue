<template>
  <div v-if="progress"
    class="ml-2 caption" :class="{'green--text': progress.remaining == 0, 'grey--text': progress.remaining > 0}">
    {{progress.completed}}/{{progress.remaining+progress.completed}}
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export default {
  name: 'program-progress',
  props: { program: { type: Object, required: true } },
  computed: mapState('transcript', { transcript: state => state }),
  subscriptions() {
    return {
      progress: combineLatest(
        this.$observe(() => this.program),
        this.$observe(() => this.transcript),
      ).pipe(map(([root, transcript]) => root.bindTranscript(transcript))),
    };
  },
};
</script>
