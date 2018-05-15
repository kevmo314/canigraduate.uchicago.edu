<template>
  <div>
    <v-card>
      <v-card-text>
        <v-layout row class="my-3">
          <label class="label body-2">{{periodName}}</label>
          <v-btn-toggle multiple v-model="periods">
            <v-btn v-for="item of periodItems" :key="item.value">
              <span class="hidden-sm-and-down">{{item.text}}</span>
              <span class="hidden-md-and-up">{{item.abbr}}</span>
            </v-btn>
          </v-btn-toggle>
        </v-layout>
        <v-divider></v-divider>
        <v-layout row class="my-3">
          <label class="label body-2">Days of the week</label>
          <v-btn-toggle multiple v-model="days">
            <v-btn>
              <span class="hidden-sm-and-down">Sunday</span>
              <span class="hidden-md-and-up">Sun</span>
            </v-btn>
            <v-btn>
              <span class="hidden-sm-and-down">Monday</span>
              <span class="hidden-md-and-up">Mon</span>
            </v-btn>
            <v-btn>
              <span class="hidden-sm-and-down">Tuesday</span>
              <span class="hidden-md-and-up">Tue</span>
            </v-btn>
            <v-btn>
              <span class="hidden-sm-and-down">Wednesday</span>
              <span class="hidden-md-and-up">Wed</span>
            </v-btn>
            <v-btn>
              <span class="hidden-sm-and-down">Thursday</span>
              <span class="hidden-md-and-up">Thu</span>
            </v-btn>
            <v-btn>
              <span class="hidden-sm-and-down">Friday</span>
              <span class="hidden-md-and-up">Fri</span>
            </v-btn>
            <v-btn>
              <span class="hidden-sm-and-down">Saturday</span>
              <span class="hidden-md-and-up">Sat</span>
            </v-btn>
          </v-btn-toggle>
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
    <div class="display-flex mt-3">
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
import { Observable, of } from 'rxjs';
import { SORT } from '@/store/modules/search';
import { mapState, mapGetters } from 'vuex';
import { map, switchMap } from 'rxjs/operators';

function createComputedProperty(field, namespace = 'filter') {
  return {
    get() {
      return this.$store.state[namespace][field];
    },
    set(value) {
      this.$store.commit(namespace + '/update', { [field]: value });
    },
  };
}

export default {
  name: 'filters',
  data() {
    return {
      sortItems: [
        { value: SORT.BY_POPULARITY, text: 'By popularity' },
        { value: SORT.ALPHABETICALLY, text: 'Alphabetically' },
      ],
    };
  },
  computed: {
    ...mapGetters('institution', ['institution']),
    query: createComputedProperty.call(this, 'query'),
    periods: createComputedProperty.call(this, 'periods'),
    days: createComputedProperty.call(this, 'days'),
    departments: createComputedProperty.call(this, 'departments'),
    instructors: createComputedProperty.call(this, 'instructors'),
    sort: createComputedProperty.call(this, 'sort', 'search'),
  },
  subscriptions() {
    const institution = this.$observe(() => this.institution);
    const institutionData = institution.pipe(
      switchMap(institution => institution.data()),
    );
    const indexes = institution.pipe(
      switchMap(institution => institution.getIndexes()),
    );
    return {
      searchPlaceholder: institutionData.pipe(
        map(institution => `Try "${institution.searchPlaceholder}"`),
      ),
      periodName: institutionData.pipe(
        map(institution => institution.periodName),
      ),
      periodItems: institutionData.pipe(
        map(institution =>
          institution.periods.map((period, value) => ({
            value,
            text: period.name,
            abbr: period.shorthand,
          })),
        ),
      ),
      departmentItems: indexes.pipe(map(index => index.getDepartments())),
      instructorItems: indexes.pipe(map(index => index.getInstructors())),
    };
  },
};
</script>

<style scoped>
.label {
  width: 150px;
  align-self: center;
  text-align: right;
  margin-right: 16px;
}

.sort {
  flex-shrink: 0;
}
</style>
