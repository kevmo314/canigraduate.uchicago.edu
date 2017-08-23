<template>
  <v-chip :outline="outline" label small class="ma-0 ml-1 elevation-0" v-tooltip:bottom="tooltip && {html:tooltip}"
    :style="{backgroundColor: !suppressed && backgroundColor, borderColor: backgroundColor}"
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
    }
  },
  computed: {
    ...mapState('institution', {
      converters: state => state.converters,
      terms: state => state.endpoints.terms,
      offerings: state => state.endpoints.offerings,
      periods: state => state.periods,
    }), ...mapState('filter', {
      suppressed(state) {
        return state.periods.filter(i => i < this.periods.length)
          .find(i => this.periods[i].name == this.period.name) == null;
      },
    })
  },
  subscriptions() {
    const lastPeriod = this.offerings(this.course).map(terms => {
      // Find the most recent relevant offering.
      for (const term of terms) {
        if (this.converters.termToPeriod(term).name == this.period.name) {
          return this.period.name + ' ' + this.converters.termToYear(term);
        }
      }
    });
    return {
      tooltip: lastPeriod,
      outline: Observable.combineLatest(this.terms(), lastPeriod)
        .map(([terms, last]) => terms.indexOf(last) > 32),
      backgroundColor: lastPeriod.map(x => x && this.period.color)
    }
  }
}
</script>
