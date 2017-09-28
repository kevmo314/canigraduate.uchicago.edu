<template>
  <v-card>
    <v-card-title class="body-1">
      <slot />
    </v-card-title>
    <v-card-text>
      <v-slide-y-transition>
        <div>
          <requirement v-for="(requirement, index) of program.requirements" :requirement="requirement"
            :key="index"></requirement>
        </div>
      </v-slide-y-transition>
    </v-card-text>
  </v-card>
</template>

<script>
import Requirement from '@/components/Requirement';

export default {
  name: 'program',
  components: { Requirement },
  props: { program: { type: Object, required: true } }
}
</script>
