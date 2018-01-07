<template>
  <div v-if="progress"
    class="ml-2 caption" :class="{'green--text': progress.remaining == 0, 'grey--text': progress.remaining > 0}">
    {{progress.completed}}/{{progress.remaining+progress.completed}}
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

export default {
  name: 'program-progress',
  props: { program: { type: Object, required: true } },
  computed: mapState('transcript', { transcript: state => state }),
  subscriptions() {
    const program = this.$watchAsObservable(() => this.program, {
      immediate: true,
    }).map(x => x.newValue);
    const transcript = this.$watchAsObservable(() => this.transcript, {
      immediate: true,
    }).map(x => x.newValue);
    return {
      progress: Observable.combineLatest(
        program,
        transcript,
      ).flatMap(([root, transcript]) => {
        return root.bindTranscript(transcript);
      }),
    };
  },
};
</script>
