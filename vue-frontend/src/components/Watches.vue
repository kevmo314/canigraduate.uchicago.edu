<template>
  <div>
    <v-card>
      <v-card-title primary-title class="headline">Your watches</v-card-title>
      <v-card-text>
        <div class="text-xs-center">
          <img src="../assets/shore.png" alt>
          <p>You don't have any watches. Add one below!</p>
        </div>
      </v-card-text>
    </v-card>
    <form>
      <v-card class="mt-3">
        <v-card-title primary-title class="headline">Add a watch</v-card-title>
        <v-card-text>
          <p>Blank fields will act as wildcards.</p>
          <v-layout row>
            <v-flex xs4>
              <v-select :items="terms" v-model="term" label="Term" autocomplete></v-select>
            </v-flex>
            <v-flex xs4>
              <v-select :items="courses" v-model="course" label="Course" :hint="courseHint" persistent-hint autocomplete></v-select>
            </v-flex>
            <v-flex xs4>
              <v-text-field label="Section" v-model="section"></v-text-field>
            </v-flex>
          </v-layout>
        </v-card-text>
        <v-card-actions>
          <v-btn flat class="orange--text" @click="addWatch()" type="submit">Add Watch</v-btn>
        </v-card-actions>
      </v-card>
    </form>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  data() {
    return { term: '', course: '', section: '', courseHint: '' }
  },
  computed: mapState('institution', { endpoints: state => state.endpoints }),
  subscriptions() {
    return {
      courses: this.endpoints.courses(),
      terms: this.endpoints.terms()
    }
  },
  watch: {
    course(course) {
      this.endpoints.courseName(course).first().subscribe(name => this.courseHint = name);
    }
  },
  methods: {
    addWatch() {
      
    }
  }
}
</script>

<style scoped>

</style>
