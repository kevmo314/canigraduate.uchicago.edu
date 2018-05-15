<template>
  <span>
    <span v-for="block of blocks" :key="block.offset" :class="{'green--text': !block.ignore && block.state, 'red--text': !block.ignore && !block.state}">
      <v-icon v-if="!block.ignore && block.state" class="green--text icon">check</v-icon>
      <v-icon v-else-if="!block.ignore && !block.state" class="red--text icon">clear</v-icon>
      <span class="text">{{block.text}}</span>
    </span>
  </span>
</template>

<script>
import { Subject } from 'rxjs/Subject';
import { mapGetters } from 'vuex';
import { map, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import Vue from 'vue';

export default {
  computed: mapGetters('institution', ['institution']),
  subscriptions() {
    return {
      blocks: combineLatest(
        this.$observe(() => this.institution).pipe(
          switchMap(institution => institution.courses),
        ),
        this.$observe(() => this.$store.state.transcript).pipe(
          map(t =>
            t.filter(record => record.credit).map(record => record.course),
          ),
          map(t => new Set(t)),
        ),
        this.$observe(() => this.$slots.default[0].text),
      ).pipe(
        map(([courses, transcript, content]) => {
          const regex = new RegExp(courses.join('|'), 'g');
          let match;
          const matches = [];
          while ((match = regex.exec(content))) {
            matches.push([match.index, match[0]]);
          }
          const blocks = [];
          let last = 0;
          matches.forEach(([index, match]) => {
            if (index > last) {
              blocks.push({
                offset: last,
                text: content.substring(last, index),
                ignore: true,
              });
            }
            blocks.push({ offset: index, text: match, state: taken[match] });
            last = index + match.length;
          });
          if (last < content.length) {
            blocks.push({
              offset: last,
              text: content.substring(last),
              ignore: true,
            });
          }
          return blocks;
        }),
      ),
    };
  },
};
</script>

<style scoped>
.icon {
  font-size: 18px;
  margin-right: -4px;
  margin-top: -2px;
}

.text {
  white-space: pre-wrap;
}
</style>