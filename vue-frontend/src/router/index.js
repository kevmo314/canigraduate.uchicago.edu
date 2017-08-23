import Vue from 'vue';
import Router from 'vue-router';
import About from '@/components/About';
import Catalog from '@/components/Catalog';
import Search from '@/components/Search';
import Watches from '@/components/Watches';
import Analytics from '@/components/Analytics';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Catalog',
      component: Catalog,
    },
    {
      path: '/search',
      name: 'Search',
      component: Search,
    },
    {
      path: '/watches',
      name: 'Watches',
      component: Watches,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: Analytics,
    },
  ],
});
