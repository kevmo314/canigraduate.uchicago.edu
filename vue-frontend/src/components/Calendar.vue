<template>
  <svg width="100%" :height="((latest / 60 - earliest / 60 + 2) * 48 + 24) + 'px'" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="1" height="48" patternUnits="userSpaceOnUse">
        <path d="M 0 0 L 1 0" fill="none" stroke="gray" stroke-width="0.5"/>
      </pattern>
      <pattern id="subgrid" width="1" height="48" patternUnits="userSpaceOnUse">
        <path d="M 0 23.5 L 1 23.5" fill="none" stroke="gray" stroke-width="0.5" style="opacity:0.15"/>
      </pattern>
    </defs>
    <svg width="6%" height="100%" y="20">
      <rect width="100%" height="100%" fill="url(#grid)" />
      <text text-anchor="end" x="80%" :y="(index * 48 + 16)" class="caption"
          v-for="(time, index) of times" :key="time">{{time}}</text>
    </svg>
    <svg width="94%" height="100%" x="6%">
      <text text-anchor="middle" :x="(index * 20 + 10) + '%'" y="10" class="body-2" 
          v-for="(day, index) in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']" :key="day">
        {{day}}
      </text>
      <svg height="100%" y="20">
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#subgrid)" />
        <svg v-for="({course, schedule, type, color}, index) of schedules"
          v-if="schedule[0] >= 1440 && schedule[0] < 1440 * 6"
          :key="course + ' ' + schedule[0]"
          :x="(Math.floor(schedule[0] / 1440) * 20 - 20 + (index > 0 && schedule[0] < schedules[index - 1].schedule[1] ? 2 : 0)) + '%'"
          :width="index > 0 && schedule[0] < schedules[index - 1].schedule[1] ? '17%' : '19%'"
          :y="(schedule[0] % 1440 - earliest) * 48 / 60 + 48"
          :height="(schedule[1] - schedule[0]) * 48 / 60"
          class="block"
          @click="reset({query: course})">
          <rect width="100%" height="100%" :style="{fill: color, strokeWidth: 1, stroke: 'black'}" />
          <text text-anchor="left" x="4" y="16" class="caption">{{course}}</text>
          <text text-anchor="left" x="4" y="32" class="caption">{{type}}</text>
        </svg>
      </svg>
    </svg>
  </svg>
</template>

<script>
import { Observable } from 'rxjs/Observable';
import {mapActions} from 'vuex';

const COLORS = ['#CDDC39', '#F44336', '#2196F3', '#FF9800', '#009688', '#795548']

export default {
  name: 'calendar',
  props: {
    records: {
      type: Array,
      required: true,
    },
    term: {
      type: String,
      required: true
    }
  },
  computed: {
    earliest() {
      return this.schedules.length > 0 ?
        (Math.floor(Math.min(...this.schedules.map(x => x.schedule[0] % 1440)) / 60) * 60) : 360;
    },
    latest() {
      return this.schedules.length > 0 ?
        (Math.ceil(Math.max(...this.schedules.map(x => x.schedule[1] % 1440)) / 60) * 60) : 1260;
    },
    times() {
      return ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'].slice(
        this.earliest / 60 - 6,
        this.latest / 60 - 4
      )
    }
  },
  methods: mapActions('filter', ['reset']),
  subscriptions() {
    function parseSchedule(activity) {
      return (activity.schedule || []).map(schedule => ({
        schedule, type: activity.type
      }))
    }
    const flatten = (a, b) => a.concat(b);
    return {
      schedules: Observable.of([this.records, this.term]).concat(
        Observable.combineLatest(
          this.$watchAsObservable(() => this.records).map(x => x.newValue),
          this.$watchAsObservable(() => this.term).map(x => x.newValue)
        )).switchMap(
        ([records, term]) => {
          if(records.length == 0) {
            return Observable.of([]);
          }
          return Observable.combineLatest(records.map(record =>
                  this.$store.state.institution.endpoints.schedules(
                      record.course, term)
                  // Pick the section.
                  .map(schedule => schedule[record.section])
                  // Pull the schedules.
                  .map(schedule => {
                    const results = (schedule.primaries || []).map(parseSchedule).reduce(flatten, []);
                    if(schedule.secondaries && record.activity && schedule.secondaries[record.activity]) {
                      results.push(...parseSchedule(schedule.secondaries[record.activity]));
                    }
                    return results;
                  })
                  // Add the course id.
                  .map(schedule => schedule.map(s => Object.assign(s, {
                      course: record.course
                  })))))
              // Flatten the array and assign a color.
              .map(schedule => schedule.reduce((accumulator, value, index) => {
                return accumulator.concat(value.map(block => Object.assign(block, {color: COLORS[index]}))) 
              }, []))
              // Sort by time desc.
              .map(schedule => schedule.sort((a, b) => a.schedule[0] - b.schedule[0]))
              .map(Object.freeze);
      })
    }
  }
}
</script>

<style scoped>
.block {
  cursor: pointer;
}
</style>