<template>
  <v-chip label small class="ma-0 ml-1 white--text elevation-0" v-tooltip:bottom="tooltip && {html:tooltip}"
    :style="{backgroundColor: suppressed ? '' : backgroundColor}">
    {{period.shorthand}}
  </v-chip>
</template>

<script>
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
    const tooltip = this.offerings(this.course).map(terms => {
      // Find the most recent relevant offering.
      for (const term of terms) {
        if (this.converters.termToPeriod(term).name == this.period.name) {
          return this.period.name + ' ' + this.converters.termToYear(term);
        }
      }
    });
    return {
      tooltip,
      backgroundColor: tooltip.map(x => x && this.period.color)
    }
  }
}
</script>
