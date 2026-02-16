import { _ as _sfc_main$1 } from './Card-B0Nd1Kdd.mjs';
import { _ as _sfc_main$2 } from './Button-BZcARdSq.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$3 } from './Input-BDe6KmrB.mjs';
import { v as vueExports, s as serverRenderer_cjs_prodExports, n as navigateTo } from './server.mjs';
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
import './nuxt-link-zI8G8B_a.mjs';
import 'node:stream';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue';

const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = _sfc_main$1;
      const _component_UButton = _sfc_main$2;
      const _component_UDivider = vueExports.resolveComponent("UDivider");
      const _component_UFormField = _sfc_main$1$1;
      const _component_UInput = _sfc_main$3;
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(vueExports.mergeProps({ class: "min-h-screen bg-gray-950 flex items-center justify-center" }, _attrs))}><div class="w-full max-w-md px-6"><div class="text-center mb-8"><h1 class="text-3xl font-bold text-white tracking-tight"> CommerceJS <span class="text-primary-400">Cloud</span></h1><p class="mt-2 text-gray-400"> Deploy and manage your commerce store </p></div>`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UCard, { class: "bg-gray-900 border-gray-800" }, {
        header: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h2 class="text-lg font-semibold text-white"${_scopeId}> Sign in </h2>`);
          } else {
            return [
              vueExports.createVNode("h2", { class: "text-lg font-semibold text-white" }, " Sign in ")
            ];
          }
        }),
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-4"${_scopeId}>`);
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
              block: "",
              size: "lg",
              color: "neutral",
              variant: "outline",
              icon: "i-simple-icons-github",
              label: "Continue with GitHub",
              onClick: () => {
              }
            }, null, _parent2, _scopeId));
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UDivider, { label: "or" }, null, _parent2, _scopeId));
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UFormField, { label: "Email" }, {
              default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                    type: "email",
                    placeholder: "you@example.com",
                    size: "lg"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vueExports.createVNode(_component_UInput, {
                      type: "email",
                      placeholder: "you@example.com",
                      size: "lg"
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UFormField, { label: "Password" }, {
              default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                    type: "password",
                    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                    size: "lg"
                  }, null, _parent3, _scopeId2));
                } else {
                  return [
                    vueExports.createVNode(_component_UInput, {
                      type: "password",
                      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                      size: "lg"
                    })
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
              block: "",
              size: "lg",
              color: "primary",
              label: "Sign in",
              onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : vueExports.unref(navigateTo))("/projects")
            }, null, _parent2, _scopeId));
            _push2(`</div>`);
          } else {
            return [
              vueExports.createVNode("div", { class: "space-y-4" }, [
                vueExports.createVNode(_component_UButton, {
                  block: "",
                  size: "lg",
                  color: "neutral",
                  variant: "outline",
                  icon: "i-simple-icons-github",
                  label: "Continue with GitHub",
                  onClick: () => {
                  }
                }),
                vueExports.createVNode(_component_UDivider, { label: "or" }),
                vueExports.createVNode(_component_UFormField, { label: "Email" }, {
                  default: vueExports.withCtx(() => [
                    vueExports.createVNode(_component_UInput, {
                      type: "email",
                      placeholder: "you@example.com",
                      size: "lg"
                    })
                  ]),
                  _: 1
                }),
                vueExports.createVNode(_component_UFormField, { label: "Password" }, {
                  default: vueExports.withCtx(() => [
                    vueExports.createVNode(_component_UInput, {
                      type: "password",
                      placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                      size: "lg"
                    })
                  ]),
                  _: 1
                }),
                vueExports.createVNode(_component_UButton, {
                  block: "",
                  size: "lg",
                  color: "primary",
                  label: "Sign in",
                  onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : vueExports.unref(navigateTo))("/projects")
                }, null, 8, ["onClick"])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-DFUO672r.mjs.map
