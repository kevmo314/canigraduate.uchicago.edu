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
import EventBus from "@/EventBus";
import { mapGetters } from "vuex";
import { map, switchMap } from "rxjs/operators";
import { combineLatest } from "rxjs";

const DAYS = ["Su", "M", "T", "W", "Th", "F", "Sa"];

function formatTime(t) {
  const hour = (Math.floor(t / (60 * 60)) + 11) % 12 + 1;
  const minute = Math.floor(t / 60) % 60;
  const beforeNoon = t * 2 < 86400;
  return hour + (minute < 10 ? ":0" : ":") + minute + (beforeNoon ? "a" : "p");
}

export default {
  name: "schedule-bar",
  props: {
    schedule: {
      type: Array,
      required: true
    }
  },
  computed: {
    ...mapGetters("institution", ["institution"]),
    tooltip() {
      const blocks = this.schedule.slice().sort((a, b) => a.day - b.day);
      const output = [];
      for (let i = 0; i < blocks.length; i++) {
        const days = [DAYS[blocks[i].day]];
        for (let j = i + 1; j < blocks.length; j++) {
          if (
            blocks[i].start == blocks[j].start &&
            blocks[i].end == blocks[j].end
          ) {
            days.push(DAYS[blocks[j].day]);
            blocks.splice(j, 1);
          }
        }
        output.push(
          days.join(" ") +
            " " +
            formatTime(blocks[i].start) +
            "-" +
            formatTime(blocks[i].end)
        );
      }
      return output.join(", ");
    }
  },
  subscriptions() {
    return {
      components: combineLatest(
        this.$observe(() => this.schedule),
        this.$observe(() => this.institution).pipe(
          switchMap(institution => institution.data()),
          map(institution => institution.scheduleBlocks)
        ),
        (schedule, scheduleBlocks) => {
          return schedule
            .concat()
            .sort((a, b) => a.day - b.day)
            .map(time => {
              const block = scheduleBlocks.find(
                scheduleBlock =>
                  scheduleBlock.start * 60 <= time.start &&
                  time.end < scheduleBlock.end * 60
              );
              return {
                day: DAYS[time.day],
                cssClass: block ? block.cssClass : "other"
              };
            });
        }
      )
    };
  },
  methods: {
    showScheduleTab() {
      EventBus.$emit("show-schedule-tab");
    }
  }
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
