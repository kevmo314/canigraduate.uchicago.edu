<template>
  <div>
    <div v-for="(section, sectionId) of schedules" :key="sectionId">
      <div class="flex section-header ma-2">
        <div class="section-id">&sect;{{sectionId}}</div>
        <div class="grow primaries ml-2">
          <div class="flex section-primary" v-for="primary of section.primaries" row :key="primary.type + '/' + primary.location">
            <div class="activity-type">{{primary.type}}</div>
            <div class="grow ml-2">{{primary.instructors.join(', ')}}</div>
            <div>{{primary.location}}</div>
            <schedule-bar :schedule="primary.schedule" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ScheduleBar from '@/components/ScheduleBar';
import { Observable } from 'rxjs/Observable';
import { mapState } from 'vuex';

export default {
  name: 'section-detail',
  components: { ScheduleBar },
  props: {
    term: {
      type: String,
      required: true,
    }
  },
  computed: mapState('institution', { endpoints: state => state.endpoints }),
  data() { return { course: this.$slots.default[0].text }; },
  subscriptions() {
    return { schedules: this.endpoints.schedules(this.course, this.term).first() }
  },
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

.section-header {
  display: flex;
}

.section-primary {
  display: flex;
}
</style>
