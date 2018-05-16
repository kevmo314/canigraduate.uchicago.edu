<template>
  <div>
    <v-subheader class="mt-0">Filters</v-subheader>
    <filters />
    <v-slide-y-reverse-transition>
      <div v-if="results && results.length > 0">
        <v-subheader class="mt-0 display-flex">
          <div class="flex-grow">
            {{resultCount}}
            <template v-if="resultCount == 1">result</template>
            <template v-else>results</template>
          </div>
          <div class="caption">Rendered in
            <span class="green--text caption">{{Math.ceil(resultTime - eventTime)}}ms</span>
          </div>
        </v-subheader>
        <search-result v-for="result in results" :key="result" :value="resultCount == 1"
          :serialized="serialized">{{result}}</search-result>
        <div class="text-xs-center mt-3">
          <v-pagination v-if="resultCount > 1" :length="Math.ceil(resultCount / resultsPerPage)"
            v-model="page"></v-pagination>
        </div>
      </div>
      <div class="text-xs-center mt-5" v-else-if="results">
        <p>Oh no, your search didn't return any results.</p>
        <v-btn flat primary @click.native="reset()">Clear Filters</v-btn>
      </div>
      <div class="text-xs-center mt-5" v-else>
        <p>Just a sec, data is loading!</p>
      </div>
    </v-slide-y-reverse-transition>
  </div>
</template>

<script>
import Filters from '@/components/Filters.vue';
import SearchResult from '@/components/SearchResult.vue';
import IntervalTree from '@/lib/interval-tree';
import partialSort from '@/lib/partial-sort';
import { mapState, mapActions, mapGetters } from 'vuex';
import { SORT } from '@/store/modules/search';
import {
  switchMap,
  map,
  publishReplay,
  refCount,
  tap,
  first,
} from 'rxjs/operators';
import { fromEventPattern, combineLatest, of } from 'rxjs';

export default {
  components: { Filters, SearchResult },
  data() {
    return { resultsPerPage: 10 };
  },
  computed: {
    ...mapGetters('institution', ['institution']),
    page: {
      get() {
        return this.$store.state.search.page;
      },
      set(page) {
        this.$store.commit('search/update', { page });
      },
    },
  },
  subscriptions() {
    const institution$ = this.$observe(() => this.institution);
    const page = this.$observe(() => this.page);
    const resultsPerPage = this.$observe(() => this.resultsPerPage);
    const filterEvents = this.$observe(() => this.$store.state.filter, {
      deep: true,
    });
    const sortEvents = this.$observe(() => this.$store.state.search.sort);
    const results = institution$.pipe(
      switchMap(institution => {
        return filterEvents.pipe(
          map(x => ({
            ...x,
            days: x.days
              .map(day => [1440 * day, 1440 * (day + 1)])
              .reduce(
                (tree, interval) => tree.add(interval),
                new IntervalTree(),
              ),
          })),
          obs => institution.search(obs),
          tap(results => {
            const maxPage = Math.ceil(
              results.courses.length / this.resultsPerPage,
            );
            if (this.$store.state.search.page > maxPage && maxPage > 0) {
              this.$store.commit('search/setPage', maxPage);
            }
          }),
          publishReplay(1),
          refCount(),
        );
      }),
    );
    let sortLeft = 0;
    const sortedResults = combineLatest(
      // Reset the sortLeft boundary.
      results.pipe(tap(() => (sortLeft = 0))),
      page,
      resultsPerPage,
      combineLatest(institution$, sortEvents).pipe(
        switchMap(([institution, sort]) => {
          const sortAlphabetically = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
          if (sort == SORT.BY_POPULARITY) {
            return institution.getCourseRanking().pipe(
              map(rankings => (a, b) => {
                return (
                  (rankings[b] | 0) - (rankings[a] | 0) ||
                  sortAlphabetically(a, b)
                );
              }),
            );
          } else if (sort == SORT.ALPHABETICALLY) {
            return of(sortAlphabetically);
          }
        }),
      ),
    ).pipe(
      map(([results, page, resultsPerPage, sortFn]) => {
        if (sortLeft < page * resultsPerPage) {
          // Indicate to future calls the left boundary has been sorted.
          partialSort(
            results.courses,
            sortLeft,
            (sortLeft = page * resultsPerPage),
            sortFn,
          );
        }
        return results.courses.slice(
          (page - 1) * resultsPerPage,
          page * resultsPerPage,
        );
      }),
      publishReplay(1),
      refCount(),
    );
    return {
      results: sortedResults,
      serialized: results.pipe(
        map(results => Object.freeze(results.serialized)),
      ),
      eventTime: filterEvents.pipe(map(() => performance.now())),
      resultTime: filterEvents.pipe(
        switchMap(() => sortedResults.pipe(first())),
        switchMap(() => this.$nextTick()),
        map(() => performance.now()),
      ),
      resultCount: results.pipe(map(results => results.courses.length)),
    };
  },
  methods: mapActions('filter', ['reset']),
};
</script>
