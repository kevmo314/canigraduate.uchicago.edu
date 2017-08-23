<template>
  <div>
    <svg width="100%" :height="height * 32 / 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="1" height="32" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 1 0" fill="none" stroke="gray" stroke-width="0.5" />
        </pattern>
        <pattern id="subgrid" width="1" height="32" patternUnits="userSpaceOnUse">
          <path d="M 0 15.5 L 1 15.5" fill="none" stroke="gray" stroke-width="0.5" style="opacity:0.15"
          />
        </pattern>
      </defs>
      <svg width="8%" :height="times.length * 32 + 1">
        <g :style="{transform: 'translate(0, ' + (-(topShift * 32 / 60) + 24) + 'px)'}">
          <rect width="100%" height="100%" fill="url(#grid)" />
          <text text-anchor="end" x="80%" :y="(index * 32 + 16)" class="caption" v-for="(time, index) of times"
            :key="time">{{time}}</text>
          <rect v-for="[cssClass, range] of scheduleHints" width="4" :style="{transform: 'translate(0, '+ (range[0] * 32 / 60) + 'px)'}"
            :height="(range[1] - range[0]) * 32 / 60" :key="cssClass" :class="cssClass"
          />
        </g>
      </svg>
      <svg width="92%" height="100%" x="8%">
        <svg :height="times.length * 32 + 1">
          <g :style="{transform: 'translate(0, ' + (-(topShift * 32 / 60) + 24) + 'px)'}">
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#subgrid)" />
            <transition-group name="fade-transition" tag="g">
              <svg v-for="({course, schedule, type, color}, index) of schedules" v-if="schedule[0] >= 1440 && schedule[0] < 1440 * 6"
                :key="course + ' ' + color + ' ' + schedule[0]" :x="(Math.floor(schedule[0] / 1440) * 20 - 20 + (index > 0 && schedule[0] < schedules[index - 1].schedule[1] ? 2 : 0)) + '%'"
                :width="index > 0 && schedule[0] < schedules[index - 1].schedule[1] ? '17%' : '19%'"
                :y="(schedule[0] % 1440) * 32 / 60" :height="(schedule[1] - schedule[0]) * 32 / 60"
                class="block" @click="reset({query: course})" role="link">
                <rect width="100%" height="100%" :style="{fill: color, strokeWidth: 1, stroke: 'black'}"
                />
                <text text-anchor="left" x="4" y="16" class="caption">{{type || course}}</text>
              </svg>
            </transition-group>
            <text text-anchor="middle" class="caption" x="50%" style="fill: #9e9e9e" :y="(topShift + height / 2) * 32 / 60 - 8"
              v-if="!schedules || schedules.length == 0">(nothing scheduled)</text>
          </g>
        </svg>
      </svg>
      <rect width="100%" height="23" style="fill: white" />
      <svg width="92%" height="100%" x="8%">
        <text text-anchor="middle" :x="(index * 20 + 10) + '%'" y="10" class="body-2" v-for="(day, index) in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']"
          :key="day">
          {{day}}
        </text>
      </svg>
    </svg>
    <v-list two-line dense>
      <v-list-tile v-for="{course, section, activity, schedule, type, color, temporary} of legend"
        :key="color" class="legend-tile" @click.native="reset({query: course})">
        <v-list-tile-action>
          <v-chip small label :style="{backgroundColor: color, borderColor: 'black'}" class="ma-0 elevation-0"
          />
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>{{course}}
            <span class="caption grey--text" v-if="section">&sect;{{section}}
              <span class="caption grey--text" v-if="activity">&middot; {{activity}}</span>
            </span>
          </v-list-tile-title>
          <v-list-tile-sub-title>
            <course-name>{{course}}</course-name>
          </v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action v-if="temporary">
          <v-chip small class="primary white--text">Planned</v-chip>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </div>
</template>

<script>
import { Observable } from 'rxjs/Observable';
import CourseName from '@/components/CourseName';
import { mapState, mapActions } from 'vuex';
import TWEEN from '@tweenjs/tween.js';

const COLORS = ['#CDDC39', '#F44336', '#2196F3', '#FF9800', '#009688', '#795548']

export default {
  name: 'calendar',
  components: { CourseName },
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
  data() {
    const clock = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    return {
      topShift: 480,
      height: 600,
      times: [...clock.map(v => v + 'a'), ...clock.map(v => v + 'p')]
    }
  },
  computed: {
    ...mapState('calendar', { temporary: state => state.temporary }),
    ...mapState('institution', { scheduleHints: state => Object.entries(state.scheduleBlocks) }),
    earliest() {
      return (this.schedules || []).length > 0 ?
        (Math.floor(Math.min(...this.schedules.map(x => x.schedule[0] % 1440)) / 30) * 30) : 360;
    },
    latest() {
      return (this.schedules || []).length > 0 ?
        (Math.ceil(Math.max(...this.schedules.map(x => x.schedule[1] % 1440)) / 30) * 30) : 1260;
    },
    legend() {
      return Object.values(this.schedules.reduce((a, b) => Object.assign(a, { [b.color]: b }), {}))
        .sort((a, b) => {
          if (a.course == b.course) {
            return a.section < b.section ? -1 : 1
          }
          return a.course < b.course ? -1 : 1
        })
    }
  },
  methods: {
    ...mapActions('filter', ['reset']),
    flattenToSchedules(section, activity) {
      function parseSchedule(activity) {
        return (activity.schedule || []).map(schedule => ({
          schedule, type: activity.type
        }))
      }
      const results = (section.primaries || []).map(parseSchedule).reduce((a, b) => a.concat(b), []);
      if (section.secondaries && activity && section.secondaries[activity]) {
        results.push(...parseSchedule(section.secondaries[activity]));
      }
      return results;
    },
    tween() {
      function animate() {
        if (TWEEN.update()) {
          requestAnimationFrame(animate)
        }
      }
      this.$nextTick(() => {
        const state = { topShift: this.topShift, height: this.height }
        const height = Math.max(600, this.latest - this.earliest + 120);
        const topShift = this.earliest - (height - this.latest + this.earliest) / 2;
        new TWEEN.Tween(state)
          .easing(TWEEN.Easing.Quadratic.Out)
          .to({ topShift, height }, 500)
          .onUpdate(() => {
            this.topShift = state.topShift
            this.height = state.height
          })
          .start()
        animate()
      })
    }
  },
  subscriptions() {
    const watch = f => {
      return this.$watchAsObservable(f, { immediate: true }).map(x => x.newValue)
    }
    const schedules =
      Observable.combineLatest(
        watch(() => this.records),
        watch(() => this.term),
        watch(() => this.temporary).map(temporary => temporary.course && Object.assign(temporary, {
          color: 'rgba(255, 235, 59, 0.8)',
          temporary: true,
        })),
      ).debounceTime(50).switchMap(
        ([records, term, temporary]) => {
          if (temporary) {
            records.push(temporary);
          }
          if (records.length == 0) {
            return Observable.of([]);
          }
          return Observable.combineLatest(records.map(record =>
            this.$store.state.institution.endpoints.schedules(
              record.course, term)
              // Pick the section.
              .map(schedule => schedule[record.section])
              // Pull the schedules.
              .map(schedule => this.flattenToSchedules(schedule, record.activity))
              // Add the course id.
              .map(schedule => schedule.map(s => Object.assign(s, record)))))
            // Flatten the array and assign a color.
            .map(schedule => schedule.reduce((accumulator, value, index) => {
              return accumulator.concat(value.map(block => {
                return Object.assign(block, { color: block.color || COLORS[index] });
              }))
            }, []))
            // Sort by time desc.
            .map(schedule => schedule.sort((a, b) => a.schedule[0] - b.schedule[0]))
            .map(Object.freeze)
            .do(() => this.tween())
        })
    return { schedules: Observable.of([]).concat(schedules) }
  }
}
</script>

<style scoped>
.block {
  cursor: pointer;
}

.legend-tile>>>.list__tile {
  height: 40px;
}
</style>