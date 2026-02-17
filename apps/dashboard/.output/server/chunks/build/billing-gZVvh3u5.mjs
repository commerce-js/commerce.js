import { _ as _sfc_main$1 } from './Card-BZGIp-Gy.mjs';
import { _ as _sfc_main$2 } from './Button-XkXmlRcK.mjs';
import { _ as _sfc_main$3 } from './Badge-CUpR46_Y.mjs';
import { v as vueExports, s as serverRenderer_cjs_prodExports } from './server.mjs';
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
  __name: "billing",
  __ssrInlineRender: true,
  setup(__props) {
    const currentPlan = vueExports.ref({
      name: "Pro",
      price: "$29/mo",
      stores: "5 stores",
      deploys: "Unlimited deploys"
    });
    const invoices = vueExports.ref([
      { id: "inv_001", date: "Feb 2026", amount: "$29.00", status: "paid" },
      { id: "inv_002", date: "Jan 2026", amount: "$29.00", status: "paid" }
    ]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UCard = _sfc_main$1;
      const _component_UButton = _sfc_main$2;
      const _component_UBadge = _sfc_main$3;
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(_attrs)}><div class="mb-8"><h1 class="text-2xl font-bold text-white"> Billing </h1><p class="mt-1 text-gray-400 text-sm"> Manage your subscription and payment methods </p></div><div class="grid gap-6 lg:grid-cols-2">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UCard, { class: "bg-gray-900 border-gray-800" }, {
        header: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h2 class="text-lg font-semibold text-white"${_scopeId}> Current Plan </h2>`);
          } else {
            return [
              vueExports.createVNode("h2", { class: "text-lg font-semibold text-white" }, " Current Plan ")
            ];
          }
        }),
        footer: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
              variant: "outline",
              color: "neutral",
              label: "Manage Subscription",
              block: ""
            }, null, _parent2, _scopeId));
          } else {
            return [
              vueExports.createVNode(_component_UButton, {
                variant: "outline",
                color: "neutral",
                label: "Manage Subscription",
                block: ""
              })
            ];
          }
        }),
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-3"${_scopeId}><div class="flex items-center justify-between"${_scopeId}><span class="text-gray-400"${_scopeId}>Plan</span><span class="text-white font-medium"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(currentPlan).name)}</span></div><div class="flex items-center justify-between"${_scopeId}><span class="text-gray-400"${_scopeId}>Price</span><span class="text-white font-medium"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(currentPlan).price)}</span></div><div class="flex items-center justify-between"${_scopeId}><span class="text-gray-400"${_scopeId}>Stores</span><span class="text-white font-medium"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(currentPlan).stores)}</span></div><div class="flex items-center justify-between"${_scopeId}><span class="text-gray-400"${_scopeId}>Deployments</span><span class="text-white font-medium"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(currentPlan).deploys)}</span></div></div>`);
          } else {
            return [
              vueExports.createVNode("div", { class: "space-y-3" }, [
                vueExports.createVNode("div", { class: "flex items-center justify-between" }, [
                  vueExports.createVNode("span", { class: "text-gray-400" }, "Plan"),
                  vueExports.createVNode("span", { class: "text-white font-medium" }, vueExports.toDisplayString(vueExports.unref(currentPlan).name), 1)
                ]),
                vueExports.createVNode("div", { class: "flex items-center justify-between" }, [
                  vueExports.createVNode("span", { class: "text-gray-400" }, "Price"),
                  vueExports.createVNode("span", { class: "text-white font-medium" }, vueExports.toDisplayString(vueExports.unref(currentPlan).price), 1)
                ]),
                vueExports.createVNode("div", { class: "flex items-center justify-between" }, [
                  vueExports.createVNode("span", { class: "text-gray-400" }, "Stores"),
                  vueExports.createVNode("span", { class: "text-white font-medium" }, vueExports.toDisplayString(vueExports.unref(currentPlan).stores), 1)
                ]),
                vueExports.createVNode("div", { class: "flex items-center justify-between" }, [
                  vueExports.createVNode("span", { class: "text-gray-400" }, "Deployments"),
                  vueExports.createVNode("span", { class: "text-white font-medium" }, vueExports.toDisplayString(vueExports.unref(currentPlan).deploys), 1)
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UCard, { class: "bg-gray-900 border-gray-800" }, {
        header: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<h2 class="text-lg font-semibold text-white"${_scopeId}> Invoices </h2>`);
          } else {
            return [
              vueExports.createVNode("h2", { class: "text-lg font-semibold text-white" }, " Invoices ")
            ];
          }
        }),
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="space-y-3"${_scopeId}><!--[-->`);
            serverRenderer_cjs_prodExports.ssrRenderList(vueExports.unref(invoices), (invoice) => {
              _push2(`<div class="flex items-center justify-between py-2"${_scopeId}><div${_scopeId}><p class="text-sm text-white"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(invoice.date)}</p><p class="text-xs text-gray-500"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(invoice.id)}</p></div><div class="flex items-center gap-3"${_scopeId}><span class="text-sm text-white"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(invoice.amount)}</span>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UBadge, {
                color: "success",
                variant: "subtle",
                size: "xs"
              }, {
                default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`${serverRenderer_cjs_prodExports.ssrInterpolate(invoice.status)}`);
                  } else {
                    return [
                      vueExports.createTextVNode(vueExports.toDisplayString(invoice.status), 1)
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
              _push2(`</div></div>`);
            });
            _push2(`<!--]--></div>`);
          } else {
            return [
              vueExports.createVNode("div", { class: "space-y-3" }, [
                (vueExports.openBlock(true), vueExports.createBlock(vueExports.Fragment, null, vueExports.renderList(vueExports.unref(invoices), (invoice) => {
                  return vueExports.openBlock(), vueExports.createBlock("div", {
                    key: invoice.id,
                    class: "flex items-center justify-between py-2"
                  }, [
                    vueExports.createVNode("div", null, [
                      vueExports.createVNode("p", { class: "text-sm text-white" }, vueExports.toDisplayString(invoice.date), 1),
                      vueExports.createVNode("p", { class: "text-xs text-gray-500" }, vueExports.toDisplayString(invoice.id), 1)
                    ]),
                    vueExports.createVNode("div", { class: "flex items-center gap-3" }, [
                      vueExports.createVNode("span", { class: "text-sm text-white" }, vueExports.toDisplayString(invoice.amount), 1),
                      vueExports.createVNode(_component_UBadge, {
                        color: "success",
                        variant: "subtle",
                        size: "xs"
                      }, {
                        default: vueExports.withCtx(() => [
                          vueExports.createTextVNode(vueExports.toDisplayString(invoice.status), 1)
                        ]),
                        _: 2
                      }, 1024)
                    ])
                  ]);
                }), 128))
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/billing.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=billing-gZVvh3u5.mjs.map
