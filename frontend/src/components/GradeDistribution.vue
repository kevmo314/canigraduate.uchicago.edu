<template>
  <div>
    <template v-if="count > 0">
      <div ref="chart" class="chart">
      </div>
      <div class="caption">n = {{count}}, X̄ = {{mean.toFixed(2)}}, X̃ = {{median.toFixed(1)}}</div>
    </template>
    <div class="text-xs-center caption grey--text ma-5" v-else>(no data)</div>
  </div>
</template>

<script>
import Chartist from 'chartist';

export default {
  name: 'grade-distribution',
  props: {
    value: {
      type: Array,
      required: true,
    }
  },
  data() {
    return { chart: null }
  },
  computed: {
    data() {
      return {
        labels: this.value.map(x => x.gpa.toFixed(1)),
        series: [this.value.map(x => x.count)],
      };
    },
    count() {
      return this.value.reduce((count, x) => count + x.count, 0);
    },
    mean() {
      return this.value.reduce((total, x) => total + x.gpa * x.count, 0) / this.count;
    },
    median() {
      let total = 0;
      const target = this.count / 2;
      return this.value.find(x => {
        total += x.count;
        return total > target;
      }).gpa;
    },
  },
  mounted() {
    this.createChart();
  },
  destroyed() {
    if (this.chart) {
      this.chart.detach();
    }
  },
  watch: {
    value() {
      if (this.chart) {
        this.chart.update(this.data);
      } else {
        this.createChart();
      }
    }
  },
  methods: {
    createChart() {
      this.$nextTick(() => {
        if (!this.chart && this.$refs.chart) {
          this.chart = new Chartist.Bar(this.$refs.chart, this.data, {
            axisX: {
              offset: 10,
              position: 'start',
              scaleMinSpace: 10,
              onlyInteger: true,
              labelOffset: { x: -3 }
            },
            axisY: {
              offset: 15,
              showGrid: false,
            },
            horizontalBars: true,
            height: '400px',
          });
        }
      });
    }
  }
}
</script>

<style lang="scss">
@import '../../node_modules/chartist/dist/scss/chartist.scss';

.chart .ct-bar {
  stroke-width: 15px;
}
</style>
