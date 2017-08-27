<template>
  <div>
    <filters></filters>
    <v-slide-y-reverse-transition>
      <div v-if="results && results.length > 0">
        <search-result v-for="result in results.slice((page - 1) * resultsPerPage, page * resultsPerPage)"
          :key="result" :value="results.length == 1">{{result}}</search-result>
        <div class="text-xs-center mt-3">
          <v-pagination v-if="results.length > 1" :length="Math.ceil(results.length / resultsPerPage)"
            v-model="page"></v-pagination>
          <div class="caption grey--text text--lighten-1 mt-3" v-if="resultTime - eventTime > 0">
            Query rendered
            <span class="green--text text--darken-1">
              {{results.length}}
              <template v-if="results.length == 1">result</template>
              <template v-else>results</template>
            </span> in
            <span class="green--text text--darken-1">{{Math.ceil(resultTime - eventTime)}}ms</span>
          </div>
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
import { mapState, mapActions } from 'vuex';
import { SORT } from '@/store/modules/search';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEventPattern';

export default {
  components: { Filters, SearchResult },
  data() { return { resultsPerPage: 10 } },
  computed: {
    ...mapState('institution', {
      search: state => state.endpoints.search,
      courseRanking: state => state.endpoints.courseRanking,
    }),
    page: {
      get() {
        return this.$store.state.search.page;
      },
      set(page) {
        this.$store.commit('search/update', { page });
      }
    }
  },
  subscriptions() {
    const events = this.$watchAsObservable(() => this.$store.state.filter, { immediate: true, deep: true })
      .map(x => x.newValue)
      .publishReplay(1).refCount();
    const results = events.let(this.search).publishReplay(1).refCount();
    return {
      results: results
        .combineLatest(this.$watchAsObservable(() => this.$store.state.search.sort, { immediate: true })
          .map(x => x.newValue)
          .flatMap(sort => {
            function sortAlphabetically(a, b) {
              if (a < b) {
                return -1;
              } else if (a > b) {
                return 1;
              }
              return 0;
            }
            if (sort == SORT.BY_POPULARITY) {
              return this.courseRanking().map(rankings => {
                return (a, b) => {
                  const rankDelta = (rankings[b] | 0) - (rankings[a] | 0);
                  return rankDelta || sortAlphabetically(a, b);
                };
              });
            } else if (sort == SORT.ALPHABETICALLY) {
              return sortAlphabetically;
            }
          }), (results, sort) => results.sort(sort))
        .do(results => {
          const maxPage = Math.ceil(results.length / this.resultsPerPage);
          if (this.$store.state.search.page > maxPage && maxPage > 0) {
            this.$store.commit('search/setPage', maxPage)
          }
        }),
      eventTime: events.map(() => performance.now()),
      resultTime: results.flatMap(() => this.$nextTick()).map(() => performance.now()),
    }
  },
  methods: mapActions('filter', ['reset'])
}
</script>
