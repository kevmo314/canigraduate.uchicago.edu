<template>
  <div>
    <v-subheader>Your watches</v-subheader>
    <v-card>
      <v-card-text>
        <div v-if="!watches" class="text-xs-center my-5">
          <v-progress-circular indeterminate class="primary--text"></v-progress-circular>
        </div>
        <div class="text-xs-center" v-else-if="watches.length == 0">
          <img src="../assets/lighthouse.png" alt class="lighthouse">
          <p class="mt-3 body-2">You don't have any watches. Add one on course search!</p>
        </div>
        <v-data-table v-else :headers="headers" :items="watches" hide-actions>
          <template slot="items" slot-scope="props">
            <td class="text-xs-center">{{props.item.term || '*'}}</td>
            <td class="text-xs-center">{{props.item.course || '*'}}</td>
            <td class="text-xs-center">{{props.item.section || '*'}}</td>
            <td></td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      term: "",
      course: "",
      section: "",
      courseHint: "",
      headers: [
        { text: "Term", sortable: true, value: "term", align: "center" },
        { text: "Course", sortable: true, value: "course", align: "center" },
        { text: "Section", sortable: true, value: "section", align: "center" },
        { text: "Actions", sortable: false }
      ]
    };
  },
  computed: mapGetters("institution", ["institution"]),
  subscriptions() {
    const institution$ = this.$observe(() => this.institution);
    return {
      courses: this.endpoints.courses(),
      terms: this.endpoints.terms(),
      watches: this.endpoints.watches.read(),
      serverTimeOffset: this.endpoints.serverTimeOffset()
    };
  }
};
</script>

<style scoped>
.lighthouse {
  width: 60%;
  margin: 0;
  padding: 0;
  background-color: #800000;
}
</style>
