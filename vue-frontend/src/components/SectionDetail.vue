<template>
  <div class="mt-2" @mouseout="clearTemporary">
    <div v-for="(section, sectionId) of schedules" :key="sectionId">
      <div class="display-flex section-header pa-0" :class="{'body-2': hasMultipleSecondaries(section)}"
        @mouseover="setTemporarySection({term: section.term, section: sectionId, course, activity: !hasMultipleSecondaries(section) && Object.keys(section.secondaries || {})[0]})">
        <div class="section-id">&sect;{{sectionId}}</div>
        <div class="flex-grow primaries ml-2">
          <div class="display-flex section-primary pa-0 pb-1" v-for="primary of section.primaries"
            row :key="primary.type + '/' + primary.location">
            <div class="activity-type">{{primary.type}}</div>
            <div class="flex-grow ml-2">
              {{(primary.instructors || []).join(', ')}}
              <span v-if="(primary.instructors || []).length == 0" class="unknown">Instructor unknown</span>
              <br/> {{primary.location}}
            </div>
            <schedule-bar :schedule="primary.schedule || []" class="schedule-bar ml-2" />
            <div class="enrollment ml-2 caption">{{section.enrollment.join('/')}}</div>
          </div>
        </div>
      </div>
      <div class="display-flex pa-0 secondary-activity pb-1" :class="{'caption primary--text': hasMultipleSecondaries(section)}"
        v-for="(activity, activityId) of section.secondaries || []" :key="activityId"
        @mouseover="setTemporarySection({term: section.term, section: sectionId, course, activity: activityId})">
        <div class="section-id">{{hasMultipleSecondaries(section) ? activityId : ''}}</div>
        <div class="activity-type ml-2">{{activity.type}}</div>
        <div class="flex-grow ml-2">{{(activity.instructors || []).join(', ')}}
          <span v-if="(activity.instructors || []).length == 0" class="unknown">Instructor unknown</span>
          <br/>{{activity.location}}</div>
        <schedule-bar :schedule="activity.schedule || []" class="schedule-bar ml-2" />
        <div class="enrollment ml-2 caption">{{section.enrollment.join('/')}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import ScheduleBar from '@/components/ScheduleBar';
import IntervalTree from '@/lib/interval-tree';
import { Observable } from 'rxjs/Observable';
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
  name: 'section-detail',
  components: { ScheduleBar },
  props: {
    term: {
      type: String,
      required: true,
    }
  },
  computed: {
    ...mapState('institution', { endpoints: state => state.endpoints }),
    ...mapGetters('filter', ['daysIntervalTree'])
  },
  data() { return { course: this.$slots.default[0].text }; },
  subscriptions() {
    const schedules = this.$watchAsObservable(() => this.daysIntervalTree, { immediate: true })
      .map(x => x.newValue)
      .combineLatest(this.endpoints.schedules(this.course, this.term), (whitelistTree, schedules) => {
        return Object.entries(schedules).reduce((accumulator, [key, section]) => {
          const scheduleMatches = section.primaries.every(primary => {
            return primary.schedule.every(interval => whitelistTree.intersects(interval));
          })
          if (!scheduleMatches) {
            return accumulator;
          }
          accumulator[key] = section;
          return accumulator;
        }, {});
      })
    return { schedules }
  },
  methods: {
    ...mapActions('calendar', ['setTemporarySection', 'clearTemporary']),
    hasMultipleSecondaries(section) {
      return section.secondaries && Object.keys(section.secondaries).length > 1
    }
  }
}
</script>

<style scoped>
.section-id {
  width: 40px;
  text-align: right;
}

.activity-type {
  width: 80px;
}

.schedule-bar {
  white-space: nowrap;
  align-self: center;
}

.unknown {
  font-style: italic;
}

.enrollment {
  align-self: center;
  text-align: right;
  width: 48px;
}
</style>
