<template>
  <div v-if="data">
    <div class="display-flex section-header pa-0" :class="{'body-2': hasMultipleSecondaries(data), 'muted': !matches}"
      @mouseover="setTemporarySection({term, section, course, activity: !hasMultipleSecondaries(data) && Object.keys(data.secondaries || {})[0]})">
      <div class="section-id">&sect;{{section}}</div>
      <div class="flex-grow primaries ml-2">
        <div class="display-flex section-primary pa-0 pb-1" v-for="primary of data.primaries"
          row :key="primary.type + '/' + primary.location">
          <div class="activity-type">{{primary.type}}</div>
          <div class="flex-grow ml-2">
            {{(primary.instructors || []).join(', ')}}
            <span v-if="(primary.instructors || []).length == 0" class="unknown">Instructor unknown</span>
            <br/> {{primary.location}}
          </div>
          <schedule-bar :schedule="primary.schedule || []" class="schedule-bar ml-2" />
          <div class="enrollment ml-2 caption">{{data.enrollment.enrolled}}/{{data.enrollment.maximum}}</div>
        </div>
      </div>
    </div>
    <div class="display-flex pa-0 secondary-activity pb-1" :class="{'caption primary--text': hasMultipleSecondaries(section), 'muted': !matches}"
      v-for="activity of data.secondaries || []" :key="activity.id"
      @mouseover="setTemporarySection({term, section, course, activity: activity.id})">
      <div class="section-id">{{hasMultipleSecondaries(data) ? activity.id : ''}}</div>
      <div class="activity-type ml-2">{{activity.type}}</div>
      <div class="flex-grow ml-2">{{(activity.instructors || []).join(', ')}}
        <span v-if="(activity.instructors || []).length == 0" class="unknown">Instructor unknown</span>
        <br/>{{activity.location}}</div>
      <schedule-bar :schedule="activity.schedule || []" class="schedule-bar ml-2" />
      <div class="enrollment ml-2 caption">{{data.enrollment.enrolled}}/{{data.enrollment.maximum}}</div>
    </div>
  </div>
</template>

<script>
import ScheduleBar from "@/components/ScheduleBar";
import IntervalTree from "@/lib/interval-tree";
import { mapState, mapActions, mapGetters } from "vuex";
import { combineLatest } from "rxjs";
import { switchMap, map } from "rxjs/operators";

export default {
  name: "section-detail",
  components: { ScheduleBar },
  props: {
    course: {
      type: String,
      required: true
    },
    term: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    matches: Boolean
  },
  computed: mapGetters("institution", ["institution"]),
  subscriptions() {
    return {
      data: combineLatest(
        this.$observe(() => this.institution),
        this.$observe(() => this.course),
        this.$observe(() => this.term),
        this.$observe(() => this.section),
        (institution, course, term, section) => {
          return institution
            .course(course)
            .term(term)
            .section(section);
        }
      ).pipe(switchMap(section => section.data()))
    };
  },
  methods: {
    ...mapActions("calendar", ["setTemporarySection", "clearTemporary"]),
    hasMultipleSecondaries(section) {
      return section.secondaries && Object.keys(section.secondaries).length > 1;
    }
  }
};
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

.muted {
  opacity: 0.4;
}
</style>
