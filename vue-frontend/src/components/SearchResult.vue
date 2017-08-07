<template>
  <v-card>
    <v-card-title v-ripple @click="show = !show" class="title py-2">
      <div class="course pr-2">
        <div class="subheading grey--text text--darken-4 single-line">{{course}}
          <span class="grey--text caption">{{crosslists}}</span>
        </div>
        <div class="body-1 grey--text text--darken-2">
          <course-name>{{course}}</course-name>
        </div>
      </div>
      <div class="offering-indicators">
        <term-offering-indicator v-for="period of periods" :key="period.name" :period="period" :course="course"></term-offering-indicator>
      </div>
    </v-card-title>
    <v-slide-y-transition>
      <v-card-text v-if="show">
        <p>{{description}}</p>
        <v-layout row>
          <v-flex xs8>
            <div class="subheading">Sections</div>
  
          </v-flex>
          <v-flex xs4>
            <div class="subheading">Grades</div>
  
          </v-flex>
        </v-layout>
      </v-card-text>
    </v-slide-y-transition>
  </v-card>
</template>

<script>
import CourseName from '@/components/CourseName';
import TermOfferingIndicator from '@/components/TermOfferingIndicator';
import Chartist from 'chartist';
import { mapState } from 'vuex';

export default {
  name: 'search-result',
  components: { CourseName, TermOfferingIndicator },
  computed: {
    ...mapState('institution', {
      endpoints: state => state.endpoints,
      periods: state => state.periods
    }),
    show: {
      get() {
        return this.$store.state.search.expanded.includes(this.course);
      },
      set(expanded) {
        this.$store.commit('search/setExpanded', { course: this.course, expanded });
      }
    }
  },
  data() {
    return {
      course: this.$slots.default[0].text,
    };
  },
  subscriptions() {
    return {
      crosslists: this.endpoints.crosslists(this.course).map(identifiers => identifiers.join(', ')).first(),
      description: this.endpoints.description(this.course).first()
    }
  },
}
</script>

<style scoped>
.title {
  display: flex;
  flex-wrap: nowrap;
  cursor: pointer;
}

.course {
  flex-grow: 1;
  min-width: 0;
  line-height: 1.5;
}

.offering-indicators {
  align-self: flex-start;
  flex-shrink: 0;
}
</style>