import Vue from 'vue';
import VueRouter from 'vue-router';
import About from '@/components/About';
import Search from '@/components/Search';
import Program from '@/components/Program';
import Watches from '@/components/Watches';
import Analytics from '@/components/Analytics';

Vue.use(VueRouter);

export default new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/catalog/:id/:extension?',
      name: 'catalog',
      component: Program,
      props: true,
    },
    {
      path: '/search',
      component: Search,
    },
    {
      path: '/watches',
      component: Watches,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/analytics',
      component: Analytics,
    },
  ],
});
