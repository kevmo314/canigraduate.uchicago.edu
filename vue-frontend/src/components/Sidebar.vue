<template>
  <authentication v-if="!authenticated">
  </authentication>
  <transcript v-else></transcript>
</template>

<script>
import Authentication from '@/components/Authentication.vue';
import Transcript from '@/components/Transcript.vue';
import { AuthenticationStatus } from '@/store/modules/authentication';
import { mapState } from 'vuex';

export default {
  name: 'sidebar',
  components: { Authentication, Transcript },
  computed: {
    ...mapState('authentication', {
      authenticated: state => state.status == AuthenticationStatus.AUTHENTICATED
    })
  }
}
</script>
