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
import { Observable } from 'rxjs/Observable';
import { mapState } from 'vuex';

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
  computed: {
    ...mapState('institution', {
      converters: state => state.converters,
      terms: state => state.endpoints.terms,
      offerings: state => state.endpoints.offerings,
      periods: state => state.periods,
    }),
  },
  subscriptions() {
    const lastPeriod = this.$watchAsObservable(() => this.serialized, {
      immediate: true,
    })
      .filter(Boolean)
      .map(x => x.newValue)
      .flatMap(serialized => this.offerings(this.course, this.serialized))
      .map(terms => {
        // Find the most recent relevant offering.
        for (const term of terms) {
          if (this.converters.termToPeriod(term).name == this.period.name) {
            return this.period.name + ' ' + this.converters.termToYear(term);
          }
        }
      });
    return {
      tooltip: lastPeriod,
      outline: this.terms().combineLatest(
        lastPeriod,
        (terms, last) => terms.indexOf(last) > 32,
      ),
      backgroundColor: lastPeriod.map(x => x && this.period.color),
    };
  },
};
</script>

<style scoped>
.pointer {
  cursor: pointer;
}
</style>