<template>
  <v-card>
    <v-card-media>
      <v-tabs grow v-model="active" v-if="extensions" color="white">
        <v-tab ripple exact :to="{name: 'catalog', params: {program, extension: null}}">
          Major
          <program-progress :program="program" />
        </v-tab>
        <v-tab ripple :to="{name: 'catalog', params: {program, extension}}" v-for="extension in extensions" :key="extension">
          {{extension}}
          <program-progress :program="program" :extension="extension" />
        </v-tab>
      </v-tabs>
    </v-card-media>
    <v-card-text v-if="lifted">
      <div class="subheading">Program requirements</div>
      <requirement :lifted="lifted" :prune="!lifted.progress || lifted.progress.remaining == 0"></requirement>
      <div class="metadata">
        <div class="subheading">Meta</div>
        <p v-if="lifted.program.metadata.catalog">
          View the
          <a :href="lifted.program.metadata.catalog">college catalog page</a>.
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import Requirement from "@/components/Requirement";
import ProgramProgress from "@/components/ProgramProgress";
import EventBus from "@/EventBus";
import { mapState, mapGetters } from "vuex";
import { map, tap, switchMap } from "rxjs/operators";
import { combineLatest } from "rxjs";

export default {
  components: { Requirement, ProgramProgress },
  props: {
    program: { type: String, required: true },
    extension: { type: String, required: false }
  },
  data() {
    return { active: null };
  },
  computed: {
    ...mapState("transcript", { transcript: state => state }),
    ...mapGetters("institution", ["institution"])
  },
  beforeRouteLeave(to, from, next) {
    EventBus.$emit("set-title", null);
    next();
  },
  subscriptions() {
    const transcript = this.$observe(() => this.transcript);
    const root = combineLatest(
      this.$observe(() => this.institution),
      this.$observe(() => this.program).pipe(
        tap(program => EventBus.$emit("set-title", program))
      )
    ).pipe(map(([institution, program]) => institution.program(program)));
    const extensions = root.pipe(switchMap(program => program.extensions));
    const extension = this.$observe(() => this.extension);
    const program = combineLatest(root, extension).pipe(
      map(([root, extension]) => {
        return root && extension ? root.extension(extension) : root;
      })
    );
    const lifted = combineLatest(program, transcript).pipe(
      switchMap(([program, transcript]) => {
        return program.bindTranscript(transcript);
      })
    );
    return { extensions, lifted };
  }
};
</script>
