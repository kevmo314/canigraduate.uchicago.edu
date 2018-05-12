<template>
  <v-tooltip top>
    <span
      v-for="{day, cssClass} of components" :key="day + ' ' + cssClass"
      class="ma-0 pa-1 caption black--text block" :class="cssClass" @click="showScheduleTab"
      slot="activator">
      {{day}}
    </span>
    {{tooltip}}
  </v-tooltip>
</template>

<script>
import EventBus from '@/EventBus';
import { mapGetters } from 'vuex';
import { map, flatMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];

export default {
  name: 'schedule-bar',
  props: {
    schedule: {
      type: Array,
      required: true,
    },
  },
  computed: {
    ...mapGetters('institution', ['institution']),
    tooltip() {
      function formatTime(t) {
        t %= 1440;
        return (
          (Math.floor(t / 60) + 11) % 12 +
          1 +
          (t % 60 < 10 ? ':0' : ':') +
          t % 60 +
          (t < 720 ? 'a' : 'p')
        );
      }
      const blocks = this.schedule.concat().sort((a, b) => a[0] - b[0]);
      const output = [];
      for (let i = 0; i < blocks.length; i++) {
        const days = [DAYS[Math.floor(blocks[i][0] / 1440)]];
        for (let j = i + 1; j < blocks.length; j++) {
          if (
            blocks[i][0] % 1440 == blocks[j][0] % 1440 &&
            blocks[i][1] % 1440 == blocks[j][1] % 1440
          ) {
            days.push(DAYS[Math.floor(blocks[j][0] / 1440)]);
            blocks.splice(j, 1);
          }
        }
        output.push(days.join(' ') + ' ' + blocks[i].map(formatTime).join('-'));
      }
      return output.join(', ');
    },
  },
  subscriptions() {
    return {
      components: combineLatest(
        this.$observe(() => this.schedule),
        this.$observe(() => this.institution).pipe(
          flatMap(institution => institution.data()),
          map(institution => institution.scheduleBlocks),
        ),
        (schedule, scheduleBlocks) => {
          return schedule
            .concat()
            .sort((a, b) => a[0] - b[0])
            .map(time => {
              const block = scheduleBlocks.find(
                scheduleBlock =>
                  scheduleBlock.start <= time[0] % 1440 &&
                  time[0] % 1440 < scheduleBlock.end,
              );
              return {
                day: DAYS[Math.floor(time[0] / 1440)],
                cssClass: block ? block.cssClass : 'other',
              };
            });
        },
      ),
    };
  },
  methods: {
    showScheduleTab() {
      EventBus.$emit('show-schedule-tab');
    },
  },
};
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