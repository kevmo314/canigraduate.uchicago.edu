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
          <p class="mt-3 body-2">You don't have any watches. Add one below!</p>
        </div>
        <v-data-table v-else :headers="headers" :items="watches" hide-actions>
          <template slot="items" slot-scope="props">
            <td class="text-xs-center">{{props.item.term || '*'}}</td>
            <td class="text-xs-center">{{props.item.course || '*'}}</td>
            <td class="text-xs-center">{{props.item.section || '*'}}</td>
            <td class="text-xs-center">
              <timeago :since="props.item.created - serverTimeOffset" :auto-update="60" />
            </td>
            <td></td>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-subheader>Add a watch</v-subheader>
    <form @submit.prevent="addWatch">
      <v-card>
        <v-card-text>
          <p>Blank fields will act as wildcards.</p>
          <v-layout row>
            <v-flex xs4>
              <v-select :items="terms" v-model="term" label="Term" editable></v-select>
            </v-flex>
            <v-flex xs4>
              <v-select :items="courses" v-model="course" label="Course" :hint="courseHint" persistent-hint
                editable></v-select>
            </v-flex>
            <v-flex xs4>
              <v-text-field label="Section" v-model="section"></v-text-field>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-btn flat class="orange--text" type="submit">Add Watch</v-btn>
        </v-card-actions>
      </v-card>
    </form>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  data() {
    return {
      term: '',
      course: '',
      section: '',
      courseHint: '',
      headers: [
        { text: 'Term', sortable: true, value: 'term', align: 'center' },
        { text: 'Course', sortable: true, value: 'course', align: 'center' },
        { text: 'Section', sortable: true, value: 'section', align: 'center' },
        { text: 'Added', sortable: true, value: 'added', align: 'center' },
        { text: 'Actions', sortable: false },
      ],
    };
  },
  computed: mapState('institution', { endpoints: state => state.endpoints }),
  subscriptions() {
    return {
      courses: this.endpoints.courses(),
      terms: this.endpoints.terms(),
      watches: this.endpoints.watches.read(),
      serverTimeOffset: this.endpoints.serverTimeOffset(),
    };
  },
  watch: {
    course(course) {
      this.endpoints
        .courseInfo(course)
        .first()
        .subscribe(course => (this.courseHint = course.name));
    },
  },
  methods: {
    addWatch() {
      this.endpoints.watches.create({
        term: this.term,
        course: this.course,
        section: this.section,
      });
    },
  },
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
