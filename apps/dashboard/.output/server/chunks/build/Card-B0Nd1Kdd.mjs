import { v as vueExports, a as useAppConfig, s as serverRenderer_cjs_prodExports } from './server.mjs';
import { t as tv, P as Primitive } from './Button-BZcARdSq.mjs';

const theme = {
  "slots": {
    "root": "rounded-lg overflow-hidden",
    "header": "p-4 sm:px-6",
    "body": "p-4 sm:p-6",
    "footer": "p-4 sm:px-6"
  },
  "variants": {
    "variant": {
      "solid": {
        "root": "bg-inverted text-inverted"
      },
      "outline": {
        "root": "bg-default ring ring-default divide-y divide-default"
      },
      "soft": {
        "root": "bg-elevated/50 divide-y divide-default"
      },
      "subtle": {
        "root": "bg-elevated/50 ring ring-default divide-y divide-default"
      }
    }
  },
  "defaultVariants": {
    "variant": "outline"
  }
};
const _sfc_main = {
  __name: "UCard",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false },
    variant: { type: null, required: false },
    class: { type: null, required: false },
    ui: { type: null, required: false }
  },
  setup(__props) {
    const props = __props;
    const slots = vueExports.useSlots();
    const appConfig = useAppConfig();
    const ui = vueExports.computed(() => {
      var _a;
      return tv({ extend: tv(theme), ...((_a = appConfig.ui) == null ? void 0 : _a.card) || {} })({
        variant: props.variant
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(Primitive), vueExports.mergeProps({
        as: __props.as,
        class: ui.value.root({ class: [(_a = props.ui) == null ? void 0 : _a.root, props.class] })
      }, _attrs), {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          var _a2, _b, _c, _d, _e, _f;
          if (_push2) {
            if (!!slots.header) {
              _push2(`<div class="${serverRenderer_cjs_prodExports.ssrRenderClass(ui.value.header({ class: (_a2 = props.ui) == null ? void 0 : _a2.header }))}"${_scopeId}>`);
              serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "header", {}, null, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!!slots.default) {
              _push2(`<div class="${serverRenderer_cjs_prodExports.ssrRenderClass(ui.value.body({ class: (_b = props.ui) == null ? void 0 : _b.body }))}"${_scopeId}>`);
              serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (!!slots.footer) {
              _push2(`<div class="${serverRenderer_cjs_prodExports.ssrRenderClass(ui.value.footer({ class: (_c = props.ui) == null ? void 0 : _c.footer }))}"${_scopeId}>`);
              serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "footer", {}, null, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              !!slots.header ? (vueExports.openBlock(), vueExports.createBlock("div", {
                key: 0,
                class: ui.value.header({ class: (_d = props.ui) == null ? void 0 : _d.header })
              }, [
                vueExports.renderSlot(_ctx.$slots, "header")
              ], 2)) : vueExports.createCommentVNode("", true),
              !!slots.default ? (vueExports.openBlock(), vueExports.createBlock("div", {
                key: 1,
                class: ui.value.body({ class: (_e = props.ui) == null ? void 0 : _e.body })
              }, [
                vueExports.renderSlot(_ctx.$slots, "default")
              ], 2)) : vueExports.createCommentVNode("", true),
              !!slots.footer ? (vueExports.openBlock(), vueExports.createBlock("div", {
                key: 2,
                class: ui.value.footer({ class: (_f = props.ui) == null ? void 0 : _f.footer })
              }, [
                vueExports.renderSlot(_ctx.$slots, "footer")
              ], 2)) : vueExports.createCommentVNode("", true)
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../../node_modules/.pnpm/@nuxt+ui@3.3.7_@babel+parser@7.29.0_change-case@5.4.4_db0@0.3.4_@electric-sql+pglite@0.3.15_b_iqdaty4x7fafoooh6yfa6f46wm/node_modules/@nuxt/ui/dist/runtime/components/Card.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=Card-B0Nd1Kdd.mjs.map
