<template>
  <div>
    <v-card>
      <v-card-title primary-title class="headline">
        Course Search
      </v-card-title>
      <v-card-text>
        <v-layout row>
          <label>{{periodName}}</label>
        </v-layout>
        <v-layout row>
          <v-btn-toggle v-bind:items="periodItems" multiple v-model="periods" class="hidden-sm-and-down"></v-btn-toggle>
          <v-btn-toggle v-bind:items="periodItems.map(({value, abbr}) => ({value, text: abbr}))" multiple v-model="periods" class="hidden-md-and-up"></v-btn-toggle>
        </v-layout>
        <v-divider></v-divider>
        <v-layout row>
          <label>Days of the week</label>
        </v-layout>
        <v-layout row>
          <v-btn-toggle v-bind:items="dayItems" multiple v-model="days" class="hidden-sm-and-down"></v-btn-toggle>
          <v-btn-toggle v-bind:items="dayItems.map(({value, abbr}) => ({value, text: abbr}))" multiple v-model="days" class="hidden-md-and-up"></v-btn-toggle>
        </v-layout>
        <v-divider></v-divider>
        <v-layout row>
          <v-flex xs6>
            <v-select label="Departments" v-bind:items="departmentItems" v-model="departments" multiple chips autocomplete></v-select>
          </v-flex>
          <v-flex xs6>
            <v-select label="Instructors" v-bind:items="instructorItems" v-model="instructors" multiple chips autocomplete></v-select>
          </v-flex>
        </v-layout>
      </v-card-text>
    </v-card>
    <v-card class="my-3">
      <v-card-text>
        <v-text-field aria-label="Search" :placeholder="searchPlaceholder" prepend-icon="search" single-line hide-details class="pa-0" v-model="query"></v-text-field>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapState } from 'vuex';

function createComputedProperty(field) {
  return {
    get() {
      return this.$store.state.filter[field];
    },
    set(value) {
      this.$store.commit('filter/update', { [field]: value });
    }
  }
}

let departmentsObservable = null;
let instructorsObservable = null;

export default {
  name: 'filters',
  data() {
    return {
      dayItems: [
        { value: 0, text: 'Monday', abbr: 'M' },
        { value: 1, text: 'Tuesday', abbr: 'T' },
        { value: 2, text: 'Wednesday', abbr: 'W' },
        { value: 3, text: 'Thursday', abbr: 'Th' },
        { value: 4, text: 'Friday', abbr: 'Fr' },
        { value: 5, text: 'Saturday', abbr: 'Sa' },
        { value: 6, text: 'Sunday', abbr: 'Su' },
      ],
      departmentItems: [],
      instructorItems: [],
    }
  },
  computed: {
    ...mapState('institution', {
      endpoints: state => state.endpoints,
      searchPlaceholder: state => state.searchPlaceholder,
      periodName: state => state.periodName,
      periodItems: state => state.periods.map((period, value) => ({
        value, text: period.name, abbr: period.shorthand
      })),
    }),
    query: createComputedProperty.call(this, 'query'),
    periods: createComputedProperty.call(this, 'periods'),
    days: createComputedProperty.call(this, 'days'),
    departments: createComputedProperty.call(this, 'departments'),
    instructors: createComputedProperty.call(this, 'instructors'),
  },
  created() {
    this.$store.dispatch('filter/reset');
  },
  subscriptions() {
    if (!departmentsObservable) {
      departmentsObservable = this.endpoints.departments();
    }
    if (!instructorsObservable) {
      instructorsObservable = this.endpoints.instructors();
    }
    return { departmentItems: departmentsObservable, instructorItems: instructorsObservable }
  }
}
</script>

<style scoped>
.label {
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>
