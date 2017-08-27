<template>
  <div>
    <v-card>
      <v-card-text>
        <v-layout row class="my-3">
          <label class="label body-2">{{periodName}}</label>
          <v-btn-toggle v-bind:items="periodItems" multiple v-model="periods" class="hidden-sm-and-down"></v-btn-toggle>
          <v-btn-toggle v-bind:items="periodItems.map(({value, abbr}) => ({value, text: abbr}))"
            multiple v-model="periods" class="hidden-md-and-up"></v-btn-toggle>
        </v-layout>
        <v-divider></v-divider>
        <v-layout row class="my-3">
          <label class="label body-2">Days of the week</label>
          <v-btn-toggle v-bind:items="dayItems" multiple v-model="days" class="hidden-md-and-down"></v-btn-toggle>
          <v-btn-toggle v-bind:items="dayItems.map(({value, abbr}) => ({value, text: abbr}))"
            multiple v-model="days" class="hidden-lg-and-up"></v-btn-toggle>
        </v-layout>
        <v-divider></v-divider>
        <v-layout row>
          <label class="label body-2">Departments</label>
          <v-select :items="departmentItems" v-model="departments" multiple chips autocomplete
            hide-details></v-select>
        </v-layout>
        <v-divider></v-divider>
        <v-layout row>
          <label class="label body-2">Instructors</label>
          <v-select :items="instructorItems" v-model="instructors" multiple chips autocomplete
            hide-details></v-select>
        </v-layout>
      </v-card-text>
    </v-card>
    <div class="display-flex my-3">
      <v-card class="flex-grow">
        <v-card-text>
          <v-text-field aria-label="Search" :placeholder="searchPlaceholder" prepend-icon="search"
            single-line hide-details class="pa-0" v-model="query"></v-text-field>
        </v-card-text>
      </v-card>
      <v-card class="ml-3 sort">
        <v-card-text class="py-0">
          <v-select :items="sortItems" v-model="sort" hide-details prepend-icon="sort" label="Sort"
            single-line />
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import { SORT } from '@/store/modules/search';
import { mapState } from 'vuex';

function createComputedProperty(field, namespace = 'filter') {
  return {
    get() {
      return this.$store.state[namespace][field];
    },
    set(value) {
      this.$store.commit(namespace + '/update', { [field]: value });
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
        { value: 1, text: 'Monday', abbr: 'Mon' },
        { value: 2, text: 'Tuesday', abbr: 'Tue' },
        { value: 3, text: 'Wednesday', abbr: 'Wed' },
        { value: 4, text: 'Thursday', abbr: 'Thu' },
        { value: 5, text: 'Friday', abbr: 'Fri' },
        { value: 6, text: 'Saturday', abbr: 'Sat' },
        { value: 0, text: 'Sunday', abbr: 'Sun' },
      ],
      sortItems: [
        { value: SORT.BY_POPULARITY, text: 'By popularity' },
        { value: SORT.ALPHABETICALLY, text: 'Alphabetically' },
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
    sort: createComputedProperty.call(this, 'sort', 'search'),
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
  width: 150px;
  align-self: center;
  text-align: right;
  margin-right: 16px;
}

.sort {
  flex: 0 0 200px;
}
</style>
