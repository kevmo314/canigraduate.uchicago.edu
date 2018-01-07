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
import Vue from 'vue';

export default {
  subscriptions() {
    const credits = this.$watchAsObservable(() => this.$store.state.transcript, { immediate: true })
      .map(x => x.newValue)
      .map(transcript =>
        transcript
          .filter(record => record.credit)
          .map(record => record.course),
    );
    const content = this.$watchAsObservable(() => this.$slots.default[0].text, { immediate: true })
      .map(x => x.newValue);
    return {
      blocks: this.$watchAsObservable(() => this.$store.state.institution, { immediate: true })
        .map(x => x.newValue)
        .switchMap(institution => institution.endpoints.courses())
        .combineLatest(credits, (courses, transcript) => {
          return [
            new RegExp(courses.join('|'), 'g'),
            courses.reduce((map, course) => {
              map[course] = transcript.includes(course);
              return map;
            }, {})
          ];
        })
        .combineLatest(content)
        .map(([[re, taken], content]) => {
          let match;
          const matches = [];
          while (match = re.exec(content)) {
            matches.push([match.index, match[0]]);
          }
          const blocks = [];
          let last = 0;
          matches.forEach(([index, match]) => {
            if (index > last) {
              blocks.push({ offset: last, text: content.substring(last, index), ignore: true });
            }
            blocks.push({ offset: index, text: match, state: taken[match] });
            last = index + match.length;
          });
          if (last < content.length) {
            blocks.push({ offset: last, text: content.substring(last), ignore: true });
          }
          return blocks;
        })
    }
  }
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