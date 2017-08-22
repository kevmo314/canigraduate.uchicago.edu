<template>
  <div class="wrapper">
    <span v-for="{day, cssClass, tooltip} of components" :key="day + ' ' + cssClass"
      class="ma-0 pa-1 caption black--text block" v-tooltip:bottom="tooltip && {html:tooltip}"
      :class="cssClass" @click="showScheduleTab">
      {{day}}
    </span>
  </div>
</template>

<script>
import EventBus from '@/EventBus';
import { mapState } from 'vuex';

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

export default {
  name: 'schedule-bar',
  props: {
    schedule: {
      type: Array,
      required: true,
    }
  },
  computed: {
    ...mapState('institution', { blocks: state => state.scheduleBlocks }),
    components() {
      return this.schedule.sort((a, b) => a[0] - b[0]).map(time => {
        function formatTime(t) {
          t %= 1440;
          return ((Math.floor(t / 60) + 11) % 12 + 1) + (t % 60 < 10 ? ':0' : ':') + (t % 60) + (t < 720 ? 'a' : 'p');
        }
        const block = Object.keys(this.blocks)
          .find(i => this.blocks[i][0] <= time[0] % 1440 && time[0] % 1440 < this.blocks[i][1]);
        const day = DAYS[Math.floor(time[0] / 1440)];
        return {
          day,
          cssClass: block || 'other',
          tooltip: day + ' ' + time.map(formatTime).join('-'),
        }
      })
    }
  },
  methods: {
    showScheduleTab() {
      EventBus.$emit('show-schedule-tab')
    }
  }
}
</script>

<style scoped>
.wrapper {
  cursor: pointer;
}

.block:first-child {
  border-radius: 2px 0 0 2px;
}

.block:last-child {
  border-radius: 0 2px 2px 0;
}
</style>