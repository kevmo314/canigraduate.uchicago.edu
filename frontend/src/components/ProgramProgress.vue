<template>
  <div v-if="progress"
    class="ml-2 caption" :class="{'green--text': progress.remaining == 0, 'grey--text': progress.remaining > 0}">
    {{progress.completed}}/{{progress.remaining+progress.completed}}
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { switchMap, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export default {
  name: 'program-progress',
  props: {
    program: { type: String, required: true },
    extension: { type: String, required: false },
  },
  computed: {
    ...mapGetters('institution', ['institution']),
    ...mapState('transcript', { transcript: state => state }),
  },
  subscriptions() {
    return {
      progress: combineLatest(
        this.$observe(() => this.institution),
        this.$observe(() => this.program),
        this.$observe(() => this.extension),
        this.$observe(() => this.transcript),
      ).pipe(
        switchMap(([institution, program, extension, transcript]) => {
          const root = institution.program(program);
          const model = root && extension ? root.extension(extension) : root;
          return model.bindTranscript(transcript);
        }),
        map(lifted => lifted.progress),
      ),
    };
  },
};
</script>
