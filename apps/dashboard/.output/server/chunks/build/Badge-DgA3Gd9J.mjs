import { v as vueExports, a as useAppConfig, s as serverRenderer_cjs_prodExports } from './server.mjs';
import { c as useButtonGroup, d as useComponentIcons, t as tv, P as Primitive, a as _sfc_main$5, b as _sfc_main$3 } from './Button-l5dDeH59.mjs';

const theme = {
  "slots": {
    "base": "font-medium inline-flex items-center",
    "label": "truncate",
    "leadingIcon": "shrink-0",
    "leadingAvatar": "shrink-0",
    "leadingAvatarSize": "",
    "trailingIcon": "shrink-0"
  },
  "variants": {
    "buttonGroup": {
      "horizontal": "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
      "vertical": "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]"
    },
    "color": {
      "primary": "",
      "secondary": "",
      "success": "",
      "info": "",
      "warning": "",
      "error": "",
      "neutral": ""
    },
    "variant": {
      "solid": "",
      "outline": "",
      "soft": "",
      "subtle": ""
    },
    "size": {
      "xs": {
        "base": "text-[8px]/3 px-1 py-0.5 gap-1 rounded-sm",
        "leadingIcon": "size-3",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-3"
      },
      "sm": {
        "base": "text-[10px]/3 px-1.5 py-1 gap-1 rounded-sm",
        "leadingIcon": "size-3",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-3"
      },
      "md": {
        "base": "text-xs px-2 py-1 gap-1 rounded-md",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-4"
      },
      "lg": {
        "base": "text-sm px-2 py-1 gap-1.5 rounded-md",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs",
        "trailingIcon": "size-5"
      },
      "xl": {
        "base": "text-base px-2.5 py-1 gap-1.5 rounded-md",
        "leadingIcon": "size-6",
        "leadingAvatarSize": "2xs",
        "trailingIcon": "size-6"
      }
    },
    "square": {
      "true": ""
    }
  },
  "compoundVariants": [
    {
      "color": "primary",
      "variant": "solid",
      "class": "bg-primary text-inverted"
    },
    {
      "color": "secondary",
      "variant": "solid",
      "class": "bg-secondary text-inverted"
    },
    {
      "color": "success",
      "variant": "solid",
      "class": "bg-success text-inverted"
    },
    {
      "color": "info",
      "variant": "solid",
      "class": "bg-info text-inverted"
    },
    {
      "color": "warning",
      "variant": "solid",
      "class": "bg-warning text-inverted"
    },
    {
      "color": "error",
      "variant": "solid",
      "class": "bg-error text-inverted"
    },
    {
      "color": "primary",
      "variant": "outline",
      "class": "text-primary ring ring-inset ring-primary/50"
    },
    {
      "color": "secondary",
      "variant": "outline",
      "class": "text-secondary ring ring-inset ring-secondary/50"
    },
    {
      "color": "success",
      "variant": "outline",
      "class": "text-success ring ring-inset ring-success/50"
    },
    {
      "color": "info",
      "variant": "outline",
      "class": "text-info ring ring-inset ring-info/50"
    },
    {
      "color": "warning",
      "variant": "outline",
      "class": "text-warning ring ring-inset ring-warning/50"
    },
    {
      "color": "error",
      "variant": "outline",
      "class": "text-error ring ring-inset ring-error/50"
    },
    {
      "color": "primary",
      "variant": "soft",
      "class": "bg-primary/10 text-primary"
    },
    {
      "color": "secondary",
      "variant": "soft",
      "class": "bg-secondary/10 text-secondary"
    },
    {
      "color": "success",
      "variant": "soft",
      "class": "bg-success/10 text-success"
    },
    {
      "color": "info",
      "variant": "soft",
      "class": "bg-info/10 text-info"
    },
    {
      "color": "warning",
      "variant": "soft",
      "class": "bg-warning/10 text-warning"
    },
    {
      "color": "error",
      "variant": "soft",
      "class": "bg-error/10 text-error"
    },
    {
      "color": "primary",
      "variant": "subtle",
      "class": "bg-primary/10 text-primary ring ring-inset ring-primary/25"
    },
    {
      "color": "secondary",
      "variant": "subtle",
      "class": "bg-secondary/10 text-secondary ring ring-inset ring-secondary/25"
    },
    {
      "color": "success",
      "variant": "subtle",
      "class": "bg-success/10 text-success ring ring-inset ring-success/25"
    },
    {
      "color": "info",
      "variant": "subtle",
      "class": "bg-info/10 text-info ring ring-inset ring-info/25"
    },
    {
      "color": "warning",
      "variant": "subtle",
      "class": "bg-warning/10 text-warning ring ring-inset ring-warning/25"
    },
    {
      "color": "error",
      "variant": "subtle",
      "class": "bg-error/10 text-error ring ring-inset ring-error/25"
    },
    {
      "color": "neutral",
      "variant": "solid",
      "class": "text-inverted bg-inverted"
    },
    {
      "color": "neutral",
      "variant": "outline",
      "class": "ring ring-inset ring-accented text-default bg-default"
    },
    {
      "color": "neutral",
      "variant": "soft",
      "class": "text-default bg-elevated"
    },
    {
      "color": "neutral",
      "variant": "subtle",
      "class": "ring ring-inset ring-accented text-default bg-elevated"
    },
    {
      "size": "xs",
      "square": true,
      "class": "p-0.5"
    },
    {
      "size": "sm",
      "square": true,
      "class": "p-1"
    },
    {
      "size": "md",
      "square": true,
      "class": "p-1"
    },
    {
      "size": "lg",
      "square": true,
      "class": "p-1"
    },
    {
      "size": "xl",
      "square": true,
      "class": "p-1"
    }
  ],
  "defaultVariants": {
    "color": "primary",
    "variant": "solid",
    "size": "md"
  }
};
const _sfc_main = {
  __name: "UBadge",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false, default: "span" },
    label: { type: [String, Number], required: false },
    color: { type: null, required: false },
    variant: { type: null, required: false },
    size: { type: null, required: false },
    square: { type: Boolean, required: false },
    class: { type: null, required: false },
    ui: { type: null, required: false },
    icon: { type: String, required: false },
    avatar: { type: Object, required: false },
    leading: { type: Boolean, required: false },
    leadingIcon: { type: String, required: false },
    trailing: { type: Boolean, required: false },
    trailingIcon: { type: String, required: false }
  },
  setup(__props) {
    const props = __props;
    const slots = vueExports.useSlots();
    const appConfig = useAppConfig();
    const { orientation, size: buttonGroupSize } = useButtonGroup(props);
    const { isLeading, isTrailing, leadingIconName, trailingIconName } = useComponentIcons(props);
    const ui = vueExports.computed(() => tv({ extend: tv(theme), ...appConfig.ui?.badge || {} })({
      color: props.color,
      variant: props.variant,
      size: buttonGroupSize.value || props.size,
      square: props.square || !slots.default && !props.label,
      buttonGroup: orientation.value
    }));
    return (_ctx, _push, _parent, _attrs) => {
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(Primitive), vueExports.mergeProps({
        as: __props.as,
        class: ui.value.base({ class: [props.ui?.base, props.class] })
      }, _attrs), {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "leading", {}, () => {
              if (vueExports.unref(isLeading) && vueExports.unref(leadingIconName)) {
                _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_sfc_main$5, {
                  name: vueExports.unref(leadingIconName),
                  class: ui.value.leadingIcon({ class: props.ui?.leadingIcon })
                }, null, _parent2, _scopeId));
              } else if (!!__props.avatar) {
                _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_sfc_main$3, vueExports.mergeProps({
                  size: props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                }, __props.avatar, {
                  class: ui.value.leadingAvatar({ class: props.ui?.leadingAvatar })
                }), null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
            }, _push2, _parent2, _scopeId);
            serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "default", {}, () => {
              if (__props.label !== void 0 && __props.label !== null) {
                _push2(`<span class="${serverRenderer_cjs_prodExports.ssrRenderClass(ui.value.label({ class: props.ui?.label }))}"${_scopeId}>${serverRenderer_cjs_prodExports.ssrInterpolate(__props.label)}</span>`);
              } else {
                _push2(`<!---->`);
              }
            }, _push2, _parent2, _scopeId);
            serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "trailing", {}, () => {
              if (vueExports.unref(isTrailing) && vueExports.unref(trailingIconName)) {
                _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_sfc_main$5, {
                  name: vueExports.unref(trailingIconName),
                  class: ui.value.trailingIcon({ class: props.ui?.trailingIcon })
                }, null, _parent2, _scopeId));
              } else {
                _push2(`<!---->`);
              }
            }, _push2, _parent2, _scopeId);
          } else {
            return [
              vueExports.renderSlot(_ctx.$slots, "leading", {}, () => [
                vueExports.unref(isLeading) && vueExports.unref(leadingIconName) ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$5, {
                  key: 0,
                  name: vueExports.unref(leadingIconName),
                  class: ui.value.leadingIcon({ class: props.ui?.leadingIcon })
                }, null, 8, ["name", "class"])) : !!__props.avatar ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$3, vueExports.mergeProps({
                  key: 1,
                  size: props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                }, __props.avatar, {
                  class: ui.value.leadingAvatar({ class: props.ui?.leadingAvatar })
                }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
              ]),
              vueExports.renderSlot(_ctx.$slots, "default", {}, () => [
                __props.label !== void 0 && __props.label !== null ? (vueExports.openBlock(), vueExports.createBlock("span", {
                  key: 0,
                  class: ui.value.label({ class: props.ui?.label })
                }, vueExports.toDisplayString(__props.label), 3)) : vueExports.createCommentVNode("", true)
              ]),
              vueExports.renderSlot(_ctx.$slots, "trailing", {}, () => [
                vueExports.unref(isTrailing) && vueExports.unref(trailingIconName) ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$5, {
                  key: 0,
                  name: vueExports.unref(trailingIconName),
                  class: ui.value.trailingIcon({ class: props.ui?.trailingIcon })
                }, null, 8, ["name", "class"])) : vueExports.createCommentVNode("", true)
              ])
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../../node_modules/.pnpm/@nuxt+ui@3.3.7_@babel+parser@7.29.0_aws4fetch@1.0.20_change-case@5.4.4_db0@0.3.4_@electric-sq_lsgvwuiikzww5c3ye2c3t3uj2i/node_modules/@nuxt/ui/dist/runtime/components/Badge.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=Badge-DgA3Gd9J.mjs.map
