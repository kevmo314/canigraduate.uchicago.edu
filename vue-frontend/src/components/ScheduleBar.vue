<template>
  <div class="wrapper">
    <div class="day-block" v-for="i in 5" :key="i">
      <div class="time-block" v-for="(block, index) of blocks" :key="index">
        <div class="schedule-block" :class="block.class" v-for="s of schedule.filter(s => Math.floor(s[0] / 1440) == i).map(s => [s[0] % 1440, s[1] % 1440])"
          v-if="intersects(block.range, s)" :key="s[0] * 1440 + s[1]" :style="{left: (Math.max(s[0] - block.range[0], 0) * 100 / (block.range[1] - block.range[0])) + '%',
                                                                                                              right: ((Math.min(s[1], block.range[1]) - block.range[0]) * 100 / (block.range[1] - block.range[0])) + '%'}">
  
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'schedule-bar',
  props: {
    schedule: {
      type: Array,
      required: true,
    },
    blocks: {
      type: Array,
      default: [
        { range: [8 * 60 + 30, 10 * 60 + 30], class: 'morning' },
        { range: [10 * 60 + 30, 13 * 60 + 30], class: 'noon' },
        { range: [13 * 60 + 30, 16 * 60 + 30], class: 'afternoon' },
        { range: [16 * 60 + 30, 19 * 60 + 30], class: 'evening' },
      ]
    }
  },
  methods: {
    intersects(a, b) {
      return a[0] <= b[1] && b[0] <= a[1];
    }
  }
}
</script>

<style scoped>
.morning {
  background-color: green;
}

.noon {
  background-color: blue;
}

.afternoon {
  background-color: yellow;
}

.evening {
  background-color: red;
}

.day-block {
  border-left: 1px grey solid;
  margin-left: -1px;
  display: inline-block;
}

.time-block {
  border-left: 1px grey dotted;
  margin-left: -1px;
  display: inline-block;
  position: relative;
  height: 20px;
  width: 9px;
}

.schedule-block {
  position: absolute;
  top: 0;
  bottom: 0;
}
</style>