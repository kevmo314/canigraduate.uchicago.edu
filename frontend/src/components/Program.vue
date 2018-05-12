<template>
  <v-card v-if="program">
    <v-card-media>
      <v-tabs centered v-if="root.extensions" color="white">
        <v-tab-item router exact :to="{name: 'catalog', params: {id, extension: null}}">Major
          <program-progress :program="root"></program-progress>
        </v-tab-item>
        <v-tab-item v-for="(extension, name) in root.extensions" :key="name" router :to="{name: 'catalog', params: {id, extension: name}}">
          {{extension.name}}
          <program-progress :program="extension"></program-progress>
        </v-tab-item>
      </v-tabs>
    </v-card-media>
    <v-card-text>
      <div class="subheading">Program requirements</div>
      <requirement :requirement="program" :progress="progress" :prune="!progress || progress.remaining == 0"></requirement>
      <div class="metadata">
        <div class="subheading">Meta</div>
        <p v-if="program.metadata.catalog">
          View the
          <a :href="program.metadata.catalog">college catalog page</a>.
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Requirement from '@/components/Requirement';
import ProgramProgress from '@/components/ProgramProgress';
import EventBus from '@/EventBus';
import { mapState, mapGetters } from 'vuex';
import { map, flatMap, tap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export default {
  components: { Requirement, ProgramProgress },
  props: {
    id: { type: String, required: true },
    extension: { type: String, required: false },
  },
  computed: {
    ...mapState('transcript', { transcript: state => state }),
    ...mapGetters('institution', ['institution']),
  },
  beforeRouteLeave(to, from, next) {
    EventBus.$emit('set-title', null);
    next();
  },
  subscriptions() {
    const transcript = this.$observe(() => this.transcript);
    const id = this.$observe(() => this.id);
    const extension = this.$observe(() => this.extension);
    const root = combineLatest(
      this.$observe(() => this.institution),
      this.$observe(() => this.id),
    ).pipe(
      flatMap(([institution, id]) => institution.program(id)),
      flatMap(program => program.data()),
    );
    const program = combineLatest(root, extension).pipe(
      map(([root, extension]) => {
        return root && extension ? root.extensions[extension] : root;
      }),
    );
    return {
      root: root.pipe(
        tap(program => EventBus.$emit('set-title', program.name)),
      ),
      progress: combineLatest(program, transcript).pipe(
        flatMap(([program, transcript]) => {
          return transcript.length > 0
            ? program.bindTranscript(transcript)
            : Promise.resolve();
        }),
      ),
      program,
    };
  },
};
</script>
