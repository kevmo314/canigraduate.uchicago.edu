<template>
  <v-card>
    <v-card-title primary-title class="headline">Transcript</v-card-title>
    <v-card-text>
      <v-expansion-panel>
        <v-expansion-panel-content v-for="term in terms" :key="term">
          <div slot="header">{{term}}</div>
          <v-list two-line dense>
            <v-list-tile v-for="record in transcript.filter(t => t.term == term)" :key="record.course" router to="/search" @click.native="update({query: record.course})">
              <v-list-tile-content avatar class="grey--text text--darken-4">
                <v-list-tile-title>{{record.course}}</v-list-tile-title>
                <v-list-tile-sub-title>
                  <course-name class="grey--text text--darken-2">{{record.course}}</course-name>
                </v-list-tile-sub-title>
              </v-list-tile-content>
              <v-list-tile-avatar class="grey--text text--darken-4">
                {{record.quality ? record.gpa.toFixed(1) : record.grade}}
              </v-list-tile-avatar>
            </v-list-tile>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-card-text>
  </v-card>
</template>

<script>
import CourseName from '@/components/CourseName.vue';
import { mapState, mapMutations } from 'vuex';

export default {
  name: 'transcript',
  components: { CourseName },
  data() {
    return {
      msg: 'Welcome to Your Vue.js PWA'
    }
  },
  computed: mapState({
    terms: state => Array.from(new Set(state.transcript.map(record => record.term))),
    transcript: state => state.transcript,
  }),
  methods: mapMutations('filter', ['update'])
}
</script>

<style scoped>

</style>
