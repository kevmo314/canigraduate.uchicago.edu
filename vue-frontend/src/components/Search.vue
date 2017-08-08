<template>
  <div>
    <filters></filters>
    <search-result v-for="result in (results || []).slice((page - 1) * resultsPerPage, page * resultsPerPage)" :key="result" :value="results.length == 1">{{result}}</search-result>
    <div class="text-xs-center mt-3" v-if="results && results.length > 0">
      <v-pagination :length="Math.ceil(results.length / resultsPerPage)" v-model="page"></v-pagination>
    </div>
    <div class="text-xs-center mt-3" v-else-if="results">
      <p>Oh no, your search didn't return any results.</p>
      <v-btn flat primary @click.native="reset()">Clear Filters</v-btn>
    </div>
  </div>
</template>

<script>
import Filters from '@/components/Filters.vue';
import SearchResult from '@/components/SearchResult.vue';
import { mapState, mapActions } from 'vuex';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEventPattern';

export default {
  components: { Filters, SearchResult },
  data() { return { resultsPerPage: 10 } },
  computed: {
    ...mapState('institution', { search: state => state.endpoints.search }),
    ...mapState('filter', {
      filter: state => state
    }),
    page: {
      get() {
        return this.$store.state.search.page;
      },
      set(page) {
        this.$store.commit('search/setPage', page);
      }
    }
  },
  subscriptions() {
    return {
      results: Observable.fromEventPattern(
        handle => this.$store.watch(
          state => state.filter,
          filter => handle(filter),
          { deep: true, immediate: true }),
        (handle, signal) => signal(),
      )
        .flatMap(filters => this.search(filters))
        .do(results => {
          const maxPage = Math.ceil(results.length / this.resultsPerPage);
          if (this.$store.state.search.page > maxPage && maxPage > 0) {
            this.$store.commit('search/setPage', maxPage)
          }
        })
    }
  },
  methods: mapActions('filter', ['reset'])
}
</script>
