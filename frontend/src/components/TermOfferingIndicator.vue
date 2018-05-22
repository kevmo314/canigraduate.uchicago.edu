<template>
  <v-tooltip top v-if="state == 'active'">
    <v-chip label small class="ma-0 ml-1 elevation-0 pointer white--text" slot="activator"
      :style="{backgroundColor: period.color}">
      {{period.shorthand}}
    </v-chip>
    Last offered {{tooltip}}
  </v-tooltip>
  <v-tooltip top v-else-if="state == 'old'">
    <v-chip :outline="true" label small class="ma-0 ml-1 elevation-0 pointer" slot="activator"
      :style="{opacity: 0.4, borderColor: period.color, color: period.color}">
      {{period.shorthand}}
    </v-chip>
    Last offered {{tooltip}}
  </v-tooltip>
  <v-tooltip top v-else-if="state == 'not matching'">
    <v-chip label small class="ma-0 ml-1 elevation-0 pointer" slot="activator"
      :style="{opacity: 0.4, borderColor: period.color, background: 'repeating-linear-gradient(45deg,' + period.color + ',' + period.color + ' 10px,transparent 10px,transparent 20px)'}">
      {{period.shorthand}}
    </v-chip>
    Last offered {{tooltip}}
  </v-tooltip>
  <v-chip v-else-if="state == 'not offered'" label small class="ma-0 ml-1 elevation-0 pointer" slot="activator" style="opacity: 0.4">
    {{period.shorthand}}
  </v-chip>
</template>

<script>
import { mapGetters } from 'vuex';
import { switchMap, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export default {
  name: 'term-offering-indicator',
  props: {
    period: {
      type: Object,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    matches: Boolean,
  },
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    const institution$ = this.$observe(() => this.institution);
    const course$ = this.$observe(() => this.course);
    const allTerms$ = institution$.pipe(
      switchMap(institution => institution.getIndexes()),
      map(indexes => indexes.getTerms()),
      map(terms => terms.slice().reverse()),
    );
    const terms$ = combineLatest(institution$, course$).pipe(
      switchMap(([institution, course]) => institution.course(course).terms),
    );
    const period$ = this.$observe(() => this.period);
    const matches$ = this.$observe(() => this.matches);
    const lastTerm$ = combineLatest(terms$, period$).pipe(
      map(([terms, period]) => {
        for (const term of terms) {
          if (term.indexOf(period.name) > -1) {
            return term;
          }
        }
      }),
    );
    const isOffered$ = lastTerm$.pipe(map(term => Boolean(term)));
    const isOld$ = combineLatest(allTerms$, lastTerm$).pipe(
      map(([allTerms, lastTerm]) => allTerms.indexOf(lastTerm) > 16),
    );
    return {
      tooltip: lastTerm$,
      state: combineLatest(period$, matches$, isOld$, isOffered$).pipe(
        map(([period, matches, isOld, isOffered]) => {
          if (!isOffered || (!matches && isOld)) {
            return 'not offered';
          } else if (!matches) {
            return 'not matching';
          } else if (isOld) {
            return 'old';
          }
          return 'active';
        }),
      ),
    };
  },
};
</script>

<style scoped>
.pointer {
  cursor: pointer;
}
</style>