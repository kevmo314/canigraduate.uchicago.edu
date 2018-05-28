import About from "@/components/About.vue";
import Analytics from "@/components/Analytics.vue";
import Program from "@/components/Program.vue";
import Search from "@/components/Search.vue";
import Watches from "@/components/Watches.vue";
import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

export default new VueRouter({
  mode: "history",
  routes: [
    {
      path: "/catalog/:program/:extension?",
      name: "catalog",
      component: Program,
      props: true
    },
    {
      path: "/search",
      component: Search
    },
    {
      path: "/watches",
      component: Watches
    },
    {
      path: "/about",
      component: About
    },
    {
      path: "/analytics",
      component: Analytics
    }
  ]
});
