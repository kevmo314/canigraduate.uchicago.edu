<template>
  <v-tooltip top v-if="tooltip">
    <v-chip :outline="outline" label small class="ma-0 ml-1 elevation-0 pointer" slot="activator"
      :style="{backgroundColor, borderColor: backgroundColor}"
      :class="{'grey--text': outline, 'white--text': !outline}">
      {{period.shorthand}}
    </v-chip>
    {{tooltip}}
  </v-tooltip>
  <v-chip v-else :outline="outline" label small class="ma-0 ml-1 elevation-0 pointer" slot="activator"
    :style="{backgroundColor, borderColor: backgroundColor}"
    :class="{'grey--text': outline, 'white--text': !outline}">
    {{period.shorthand}}
  </v-chip>
</template>

<script>
import { mapGetters } from 'vuex';
import { map } from 'rxjs/operators';
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
    serialized: Object,
  },
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    const terms = this.institution.course(this.course).terms;
    const lastPeriod = combineLatest(
      this.institution.data().pipe(map(institution => institution.periods)),
      terms,
      (periods, terms) => {
        for (const term of terms) {
          const period = periods.find(period => term.startsWith(period.name));
          if (period.name == this.period.name) {
            return term;
          }
        }
      },
    );
    return {
      tooltip: lastPeriod,
      outline: combineLatest(
        terms,
        lastPeriod,
        (terms, last) => terms.indexOf(last) > 32,
      ),
      backgroundColor: lastPeriod.pipe(map(x => x && this.period.color)),
    };
  },
};
</script>

<style scoped>
.pointer {
  cursor: pointer;
}
</style>