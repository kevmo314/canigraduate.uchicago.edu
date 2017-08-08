<template>
  <v-chip label small class="ma-0 ml-1 white--text elevation-0" v-tooltip:bottom="tooltip && {html:tooltip}" :style="{backgroundColor}">
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
  computed: mapState({
    converters: state => state.institution.converters,
    offerings: state => state.institution.endpoints.offerings
  }),
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
