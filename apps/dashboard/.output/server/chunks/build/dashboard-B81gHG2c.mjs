import { _ as __nuxt_component_0 } from './nuxt-link-zI8G8B_a.mjs';
import { _ as _sfc_main$1, b as _sfc_main$3 } from './Button-BZcARdSq.mjs';
import { v as vueExports, b as useRoute$1, s as serverRenderer_cjs_prodExports } from './server.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@iconify/utils';
import 'consola';
import './index-DDt1fq8p.mjs';
import 'perfect-debounce';
import 'node:stream';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue';

const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "dashboard",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute$1();
    const navigation = [
      { label: "Projects", to: "/projects", icon: "i-lucide-folder" },
      { label: "Billing", to: "/billing", icon: "i-lucide-credit-card" }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_UButton = _sfc_main$1;
      const _component_UAvatar = _sfc_main$3;
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "min-h-screen bg-gray-950 text-white" }, _attrs))}><header class="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50"><div class="mx-auto max-w-7xl flex items-center justify-between px-6 h-16"><div class="flex items-center gap-8">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-xl font-bold tracking-tight"
      }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` CommerceJS <span class="text-primary-400"${_scopeId}>Cloud</span>`);
          } else {
            return [
              vueExports.createTextVNode(" CommerceJS "),
              vueExports.createVNode("span", { class: "text-primary-400" }, "Cloud")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="hidden md:flex items-center gap-1"><!--[-->`);
      serverRenderer_cjs_prodExports.ssrRenderList(navigation, (item) => {
        _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: ["px-3 py-2 rounded-lg text-sm font-medium transition-colors", vueExports.unref(route).path.startsWith(item.to) ? "text-white bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800/50"]
        }, {
          default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${serverRenderer_cjs_prodExports.ssrInterpolate(item.label)}`);
            } else {
              return [
                vueExports.createTextVNode(vueExports.toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav></div><div class="flex items-center gap-3">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
        variant: "ghost",
        color: "neutral",
        icon: "i-lucide-bell"
      }, null, _parent));
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UAvatar, {
        text: "U",
        size: "sm"
      }, null, _parent));
      _push(`</div></div></header><main class="mx-auto max-w-7xl px-6 py-8">`);
      serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/dashboard.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=dashboard-B81gHG2c.mjs.map
