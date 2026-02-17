import { _ as _sfc_main$2 } from './Badge-DgA3Gd9J.mjs';
import { a as _sfc_main$5, _ as _sfc_main$3, r as reactivePick, t as tv, b as _sfc_main$3$1, g as get, P as Primitive } from './Button-l5dDeH59.mjs';
import { v as vueExports, b as useRoute$1, s as serverRenderer_cjs_prodExports, a as useAppConfig } from './server.mjs';
import { u as useForwardPropsEmits, a as useDirection, b as useId, P as Presence_default, c as createContext, d as useCollection, g as getActiveElement } from './Collection-DPz3StD8.mjs';
import { a as _sfc_main$6, _ as _sfc_main$1$1, u as useForwardExpose, b as useVModel$1, c as useResizeObserver } from './Input-B7Hyro7c.mjs';
import { _ as _sfc_main$4 } from './Card-CrZr6Nse.mjs';
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

const ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
const EVENT_OPTIONS = {
  bubbles: false,
  cancelable: true
};
const MAP_KEY_TO_FOCUS_INTENT = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last"
};
function getDirectionAwareKey(key, dir) {
  if (dir !== "rtl") return key;
  return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function getFocusIntent(event, orientation, dir) {
  const key = getDirectionAwareKey(event.key, dir);
  if (orientation === "vertical" && ["ArrowLeft", "ArrowRight"].includes(key)) return void 0;
  if (orientation === "horizontal" && ["ArrowUp", "ArrowDown"].includes(key)) return void 0;
  return MAP_KEY_TO_FOCUS_INTENT[key];
}
function focusFirst(candidates, preventScroll = false) {
  const PREVIOUSLY_FOCUSED_ELEMENT = getActiveElement();
  for (const candidate of candidates) {
    if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
    candidate.focus({ preventScroll });
    if (getActiveElement() !== PREVIOUSLY_FOCUSED_ELEMENT) return;
  }
}
function wrapArray(array, startIndex) {
  return array.map((_, index) => array[(startIndex + index) % array.length]);
}
const [injectRovingFocusGroupContext, provideRovingFocusGroupContext] = createContext("RovingFocusGroup");
var RovingFocusGroup_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "RovingFocusGroup",
  props: {
    orientation: {
      type: String,
      required: false,
      default: void 0
    },
    dir: {
      type: String,
      required: false
    },
    loop: {
      type: Boolean,
      required: false,
      default: false
    },
    currentTabStopId: {
      type: [String, null],
      required: false
    },
    defaultCurrentTabStopId: {
      type: String,
      required: false
    },
    preventScrollOnEntryFocus: {
      type: Boolean,
      required: false,
      default: false
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false
    }
  },
  emits: ["entryFocus", "update:currentTabStopId"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const { loop, orientation, dir: propDir } = vueExports.toRefs(props);
    const dir = useDirection(propDir);
    const currentTabStopId = useVModel$1(props, "currentTabStopId", emits, {
      defaultValue: props.defaultCurrentTabStopId,
      passive: props.currentTabStopId === void 0
    });
    const isTabbingBackOut = vueExports.ref(false);
    const isClickFocus = vueExports.ref(false);
    const focusableItemsCount = vueExports.ref(0);
    const { getItems, CollectionSlot } = useCollection({ isProvider: true });
    function handleFocus(event) {
      const isKeyboardFocus = !isClickFocus.value;
      if (event.currentTarget && event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut.value) {
        const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS);
        event.currentTarget.dispatchEvent(entryFocusEvent);
        emits("entryFocus", entryFocusEvent);
        if (!entryFocusEvent.defaultPrevented) {
          const items = getItems().map((i) => i.ref).filter((i) => i.dataset.disabled !== "");
          const activeItem = items.find((item) => item.getAttribute("data-active") === "");
          const highlightedItem = items.find((item) => item.getAttribute("data-highlighted") === "");
          const currentItem = items.find((item) => item.id === currentTabStopId.value);
          const candidateItems = [
            activeItem,
            highlightedItem,
            currentItem,
            ...items
          ].filter(Boolean);
          focusFirst(candidateItems, props.preventScrollOnEntryFocus);
        }
      }
      isClickFocus.value = false;
    }
    function handleMouseUp() {
      setTimeout(() => {
        isClickFocus.value = false;
      }, 1);
    }
    __expose({ getItems });
    provideRovingFocusGroupContext({
      loop,
      dir,
      orientation,
      currentTabStopId,
      onItemFocus: (tabStopId) => {
        currentTabStopId.value = tabStopId;
      },
      onItemShiftTab: () => {
        isTabbingBackOut.value = true;
      },
      onFocusableItemAdd: () => {
        focusableItemsCount.value++;
      },
      onFocusableItemRemove: () => {
        focusableItemsCount.value--;
      }
    });
    return (_ctx, _cache) => {
      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(CollectionSlot), null, {
        default: vueExports.withCtx(() => [vueExports.createVNode(vueExports.unref(Primitive), {
          tabindex: isTabbingBackOut.value || focusableItemsCount.value === 0 ? -1 : 0,
          "data-orientation": vueExports.unref(orientation),
          as: _ctx.as,
          "as-child": _ctx.asChild,
          dir: vueExports.unref(dir),
          style: { "outline": "none" },
          onMousedown: _cache[0] || (_cache[0] = ($event) => isClickFocus.value = true),
          onMouseup: handleMouseUp,
          onFocus: handleFocus,
          onBlur: _cache[1] || (_cache[1] = ($event) => isTabbingBackOut.value = false)
        }, {
          default: vueExports.withCtx(() => [vueExports.renderSlot(_ctx.$slots, "default")]),
          _: 3
        }, 8, [
          "tabindex",
          "data-orientation",
          "as",
          "as-child",
          "dir"
        ])]),
        _: 3
      });
    };
  }
});
var RovingFocusGroup_default = RovingFocusGroup_vue_vue_type_script_setup_true_lang_default;
var RovingFocusItem_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "RovingFocusItem",
  props: {
    tabStopId: {
      type: String,
      required: false
    },
    focusable: {
      type: Boolean,
      required: false,
      default: true
    },
    active: {
      type: Boolean,
      required: false
    },
    allowShiftKey: {
      type: Boolean,
      required: false
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false,
      default: "span"
    }
  },
  setup(__props) {
    const props = __props;
    const context = injectRovingFocusGroupContext();
    const randomId = useId();
    const id = vueExports.computed(() => props.tabStopId || randomId);
    const isCurrentTabStop = vueExports.computed(() => context.currentTabStopId.value === id.value);
    const { getItems, CollectionItem } = useCollection();
    function handleKeydown(event) {
      if (event.key === "Tab" && event.shiftKey) {
        context.onItemShiftTab();
        return;
      }
      if (event.target !== event.currentTarget) return;
      const focusIntent = getFocusIntent(event, context.orientation.value, context.dir.value);
      if (focusIntent !== void 0) {
        if (event.metaKey || event.ctrlKey || event.altKey || (props.allowShiftKey ? false : event.shiftKey)) return;
        event.preventDefault();
        let candidateNodes = [...getItems().map((i) => i.ref).filter((i) => i.dataset.disabled !== "")];
        if (focusIntent === "last") candidateNodes.reverse();
        else if (focusIntent === "prev" || focusIntent === "next") {
          if (focusIntent === "prev") candidateNodes.reverse();
          const currentIndex = candidateNodes.indexOf(event.currentTarget);
          candidateNodes = context.loop.value ? wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
        }
        vueExports.nextTick(() => focusFirst(candidateNodes));
      }
    }
    return (_ctx, _cache) => {
      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(CollectionItem), null, {
        default: vueExports.withCtx(() => [vueExports.createVNode(vueExports.unref(Primitive), {
          tabindex: isCurrentTabStop.value ? 0 : -1,
          "data-orientation": vueExports.unref(context).orientation.value,
          "data-active": _ctx.active ? "" : void 0,
          "data-disabled": !_ctx.focusable ? "" : void 0,
          as: _ctx.as,
          "as-child": _ctx.asChild,
          onMousedown: _cache[0] || (_cache[0] = (event) => {
            if (!_ctx.focusable) event.preventDefault();
            else vueExports.unref(context).onItemFocus(id.value);
          }),
          onFocus: _cache[1] || (_cache[1] = ($event) => vueExports.unref(context).onItemFocus(id.value)),
          onKeydown: handleKeydown
        }, {
          default: vueExports.withCtx(() => [vueExports.renderSlot(_ctx.$slots, "default")]),
          _: 3
        }, 8, [
          "tabindex",
          "data-orientation",
          "data-active",
          "data-disabled",
          "as",
          "as-child"
        ])]),
        _: 3
      });
    };
  }
});
var RovingFocusItem_default = RovingFocusItem_vue_vue_type_script_setup_true_lang_default;
const [injectTabsRootContext, provideTabsRootContext] = createContext("TabsRoot");
var TabsRoot_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "TabsRoot",
  props: {
    defaultValue: {
      type: null,
      required: false
    },
    orientation: {
      type: String,
      required: false,
      default: "horizontal"
    },
    dir: {
      type: String,
      required: false
    },
    activationMode: {
      type: String,
      required: false,
      default: "automatic"
    },
    modelValue: {
      type: null,
      required: false
    },
    unmountOnHide: {
      type: Boolean,
      required: false,
      default: true
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false
    }
  },
  emits: ["update:modelValue"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const { orientation, unmountOnHide, dir: propDir } = vueExports.toRefs(props);
    const dir = useDirection(propDir);
    useForwardExpose();
    const modelValue = useVModel$1(props, "modelValue", emits, {
      defaultValue: props.defaultValue,
      passive: props.modelValue === void 0
    });
    const tabsList = vueExports.ref();
    provideTabsRootContext({
      modelValue,
      changeModelValue: (value) => {
        modelValue.value = value;
      },
      orientation,
      dir,
      unmountOnHide,
      activationMode: props.activationMode,
      baseId: useId(void 0, "reka-tabs"),
      tabsList
    });
    return (_ctx, _cache) => {
      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(Primitive), {
        dir: vueExports.unref(dir),
        "data-orientation": vueExports.unref(orientation),
        "as-child": _ctx.asChild,
        as: _ctx.as
      }, {
        default: vueExports.withCtx(() => [vueExports.renderSlot(_ctx.$slots, "default", { modelValue: vueExports.unref(modelValue) })]),
        _: 3
      }, 8, [
        "dir",
        "data-orientation",
        "as-child",
        "as"
      ]);
    };
  }
});
var TabsRoot_default = TabsRoot_vue_vue_type_script_setup_true_lang_default;
function makeTriggerId(baseId, value) {
  return `${baseId}-trigger-${value}`;
}
function makeContentId(baseId, value) {
  return `${baseId}-content-${value}`;
}
var TabsContent_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "TabsContent",
  props: {
    value: {
      type: [String, Number],
      required: true
    },
    forceMount: {
      type: Boolean,
      required: false
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false
    }
  },
  setup(__props) {
    const props = __props;
    const { forwardRef } = useForwardExpose();
    const rootContext = injectTabsRootContext();
    const triggerId = vueExports.computed(() => makeTriggerId(rootContext.baseId, props.value));
    const contentId = vueExports.computed(() => makeContentId(rootContext.baseId, props.value));
    const isSelected = vueExports.computed(() => props.value === rootContext.modelValue.value);
    const isMountAnimationPreventedRef = vueExports.ref(isSelected.value);
    return (_ctx, _cache) => {
      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(Presence_default), {
        present: _ctx.forceMount || isSelected.value,
        "force-mount": ""
      }, {
        default: vueExports.withCtx(({ present }) => [vueExports.createVNode(vueExports.unref(Primitive), {
          id: contentId.value,
          ref: vueExports.unref(forwardRef),
          "as-child": _ctx.asChild,
          as: _ctx.as,
          role: "tabpanel",
          "data-state": isSelected.value ? "active" : "inactive",
          "data-orientation": vueExports.unref(rootContext).orientation.value,
          "aria-labelledby": triggerId.value,
          hidden: !present,
          tabindex: "0",
          style: vueExports.normalizeStyle({ animationDuration: isMountAnimationPreventedRef.value ? "0s" : void 0 })
        }, {
          default: vueExports.withCtx(() => [(vueExports.unref(rootContext).unmountOnHide.value ? present : true) ? vueExports.renderSlot(_ctx.$slots, "default", { key: 0 }) : vueExports.createCommentVNode("v-if", true)]),
          _: 2
        }, 1032, [
          "id",
          "as-child",
          "as",
          "data-state",
          "data-orientation",
          "aria-labelledby",
          "hidden",
          "style"
        ])]),
        _: 3
      }, 8, ["present"]);
    };
  }
});
var TabsContent_default = TabsContent_vue_vue_type_script_setup_true_lang_default;
var TabsIndicator_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "TabsIndicator",
  props: {
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false
    }
  },
  setup(__props) {
    const props = __props;
    const context = injectTabsRootContext();
    useForwardExpose();
    const activeTab = vueExports.ref();
    const indicatorStyle = vueExports.ref({
      size: null,
      position: null
    });
    vueExports.watch(() => [context.modelValue.value, context?.dir.value], async () => {
      await vueExports.nextTick();
      updateIndicatorStyle();
    }, { immediate: true });
    useResizeObserver([context.tabsList, activeTab], updateIndicatorStyle);
    function updateIndicatorStyle() {
      activeTab.value = context.tabsList.value?.querySelector('[role="tab"][data-state="active"]');
      if (!activeTab.value) return;
      if (context.orientation.value === "horizontal") indicatorStyle.value = {
        size: activeTab.value.offsetWidth,
        position: activeTab.value.offsetLeft
      };
      else indicatorStyle.value = {
        size: activeTab.value.offsetHeight,
        position: activeTab.value.offsetTop
      };
    }
    return (_ctx, _cache) => {
      return typeof indicatorStyle.value.size === "number" ? (vueExports.openBlock(), vueExports.createBlock(vueExports.unref(Primitive), vueExports.mergeProps({ key: 0 }, props, { style: {
        "--reka-tabs-indicator-size": `${indicatorStyle.value.size}px`,
        "--reka-tabs-indicator-position": `${indicatorStyle.value.position}px`
      } }), {
        default: vueExports.withCtx(() => [vueExports.renderSlot(_ctx.$slots, "default")]),
        _: 3
      }, 16, ["style"])) : vueExports.createCommentVNode("v-if", true);
    };
  }
});
var TabsIndicator_default = TabsIndicator_vue_vue_type_script_setup_true_lang_default;
var TabsList_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "TabsList",
  props: {
    loop: {
      type: Boolean,
      required: false,
      default: true
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false
    }
  },
  setup(__props) {
    const props = __props;
    const { loop } = vueExports.toRefs(props);
    const { forwardRef, currentElement } = useForwardExpose();
    const context = injectTabsRootContext();
    context.tabsList = currentElement;
    return (_ctx, _cache) => {
      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(RovingFocusGroup_default), {
        "as-child": "",
        orientation: vueExports.unref(context).orientation.value,
        dir: vueExports.unref(context).dir.value,
        loop: vueExports.unref(loop)
      }, {
        default: vueExports.withCtx(() => [vueExports.createVNode(vueExports.unref(Primitive), {
          ref: vueExports.unref(forwardRef),
          role: "tablist",
          "as-child": _ctx.asChild,
          as: _ctx.as,
          "aria-orientation": vueExports.unref(context).orientation.value
        }, {
          default: vueExports.withCtx(() => [vueExports.renderSlot(_ctx.$slots, "default")]),
          _: 3
        }, 8, [
          "as-child",
          "as",
          "aria-orientation"
        ])]),
        _: 3
      }, 8, [
        "orientation",
        "dir",
        "loop"
      ]);
    };
  }
});
var TabsList_default = TabsList_vue_vue_type_script_setup_true_lang_default;
var TabsTrigger_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ vueExports.defineComponent({
  __name: "TabsTrigger",
  props: {
    value: {
      type: [String, Number],
      required: true
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false,
      default: "button"
    }
  },
  setup(__props) {
    const props = __props;
    const { forwardRef } = useForwardExpose();
    const rootContext = injectTabsRootContext();
    const triggerId = vueExports.computed(() => makeTriggerId(rootContext.baseId, props.value));
    const contentId = vueExports.computed(() => makeContentId(rootContext.baseId, props.value));
    const isSelected = vueExports.computed(() => props.value === rootContext.modelValue.value);
    return (_ctx, _cache) => {
      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(RovingFocusItem_default), {
        "as-child": "",
        focusable: !_ctx.disabled,
        active: isSelected.value
      }, {
        default: vueExports.withCtx(() => [vueExports.createVNode(vueExports.unref(Primitive), {
          id: triggerId.value,
          ref: vueExports.unref(forwardRef),
          role: "tab",
          type: _ctx.as === "button" ? "button" : void 0,
          as: _ctx.as,
          "as-child": _ctx.asChild,
          "aria-selected": isSelected.value ? "true" : "false",
          "aria-controls": contentId.value,
          "data-state": isSelected.value ? "active" : "inactive",
          disabled: _ctx.disabled,
          "data-disabled": _ctx.disabled ? "" : void 0,
          "data-orientation": vueExports.unref(rootContext).orientation.value,
          onMousedown: _cache[0] || (_cache[0] = vueExports.withModifiers((event) => {
            if (!_ctx.disabled && event.ctrlKey === false) vueExports.unref(rootContext).changeModelValue(_ctx.value);
            else event.preventDefault();
          }, ["left"])),
          onKeydown: _cache[1] || (_cache[1] = vueExports.withKeys(($event) => vueExports.unref(rootContext).changeModelValue(_ctx.value), ["enter", "space"])),
          onFocus: _cache[2] || (_cache[2] = () => {
            const isAutomaticActivation = vueExports.unref(rootContext).activationMode !== "manual";
            if (!isSelected.value && !_ctx.disabled && isAutomaticActivation) vueExports.unref(rootContext).changeModelValue(_ctx.value);
          })
        }, {
          default: vueExports.withCtx(() => [vueExports.renderSlot(_ctx.$slots, "default")]),
          _: 3
        }, 8, [
          "id",
          "type",
          "as",
          "as-child",
          "aria-selected",
          "aria-controls",
          "data-state",
          "disabled",
          "data-disabled",
          "data-orientation"
        ])]),
        _: 3
      }, 8, ["focusable", "active"]);
    };
  }
});
var TabsTrigger_default = TabsTrigger_vue_vue_type_script_setup_true_lang_default;
const theme = {
  "slots": {
    "root": "flex items-center gap-2",
    "list": "relative flex p-1 group",
    "indicator": "absolute transition-[translate,width] duration-200",
    "trigger": [
      "group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75",
      "transition-colors"
    ],
    "leadingIcon": "shrink-0",
    "leadingAvatar": "shrink-0",
    "leadingAvatarSize": "",
    "label": "truncate",
    "trailingBadge": "shrink-0",
    "trailingBadgeSize": "sm",
    "content": "focus:outline-none w-full"
  },
  "variants": {
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
      "pill": {
        "list": "bg-elevated rounded-lg",
        "trigger": "grow",
        "indicator": "rounded-md shadow-xs"
      },
      "link": {
        "list": "border-default",
        "indicator": "rounded-full",
        "trigger": "focus:outline-none"
      }
    },
    "orientation": {
      "horizontal": {
        "root": "flex-col",
        "list": "w-full",
        "indicator": "left-0 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position)",
        "trigger": "justify-center"
      },
      "vertical": {
        "list": "flex-col",
        "indicator": "top-0 h-(--reka-tabs-indicator-size) translate-y-(--reka-tabs-indicator-position)"
      }
    },
    "size": {
      "xs": {
        "trigger": "px-2 py-1 text-xs gap-1",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs"
      },
      "sm": {
        "trigger": "px-2.5 py-1.5 text-xs gap-1.5",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs"
      },
      "md": {
        "trigger": "px-3 py-1.5 text-sm gap-1.5",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs"
      },
      "lg": {
        "trigger": "px-3 py-2 text-sm gap-2",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs"
      },
      "xl": {
        "trigger": "px-3 py-2 text-base gap-2",
        "leadingIcon": "size-6",
        "leadingAvatarSize": "xs"
      }
    }
  },
  "compoundVariants": [
    {
      "orientation": "horizontal",
      "variant": "pill",
      "class": {
        "indicator": "inset-y-1"
      }
    },
    {
      "orientation": "horizontal",
      "variant": "link",
      "class": {
        "list": "border-b -mb-px",
        "indicator": "-bottom-px h-px"
      }
    },
    {
      "orientation": "vertical",
      "variant": "pill",
      "class": {
        "indicator": "inset-x-1",
        "list": "items-center"
      }
    },
    {
      "orientation": "vertical",
      "variant": "link",
      "class": {
        "list": "border-s -ms-px",
        "indicator": "-start-px w-px"
      }
    },
    {
      "color": "primary",
      "variant": "pill",
      "class": {
        "indicator": "bg-primary",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      }
    },
    {
      "color": "secondary",
      "variant": "pill",
      "class": {
        "indicator": "bg-secondary",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
      }
    },
    {
      "color": "success",
      "variant": "pill",
      "class": {
        "indicator": "bg-success",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
      }
    },
    {
      "color": "info",
      "variant": "pill",
      "class": {
        "indicator": "bg-info",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      }
    },
    {
      "color": "warning",
      "variant": "pill",
      "class": {
        "indicator": "bg-warning",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning"
      }
    },
    {
      "color": "error",
      "variant": "pill",
      "class": {
        "indicator": "bg-error",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
      }
    },
    {
      "color": "neutral",
      "variant": "pill",
      "class": {
        "indicator": "bg-inverted",
        "trigger": "data-[state=active]:text-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted"
      }
    },
    {
      "color": "primary",
      "variant": "link",
      "class": {
        "indicator": "bg-primary",
        "trigger": "data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      }
    },
    {
      "color": "secondary",
      "variant": "link",
      "class": {
        "indicator": "bg-secondary",
        "trigger": "data-[state=active]:text-secondary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
      }
    },
    {
      "color": "success",
      "variant": "link",
      "class": {
        "indicator": "bg-success",
        "trigger": "data-[state=active]:text-success focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success"
      }
    },
    {
      "color": "info",
      "variant": "link",
      "class": {
        "indicator": "bg-info",
        "trigger": "data-[state=active]:text-info focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info"
      }
    },
    {
      "color": "warning",
      "variant": "link",
      "class": {
        "indicator": "bg-warning",
        "trigger": "data-[state=active]:text-warning focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning"
      }
    },
    {
      "color": "error",
      "variant": "link",
      "class": {
        "indicator": "bg-error",
        "trigger": "data-[state=active]:text-error focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error"
      }
    },
    {
      "color": "neutral",
      "variant": "link",
      "class": {
        "indicator": "bg-inverted",
        "trigger": "data-[state=active]:text-highlighted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted"
      }
    }
  ],
  "defaultVariants": {
    "color": "primary",
    "variant": "pill",
    "size": "md"
  }
};
const _sfc_main$1 = {
  __name: "UTabs",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false },
    items: { type: Array, required: false },
    color: { type: null, required: false },
    variant: { type: null, required: false },
    size: { type: null, required: false },
    orientation: { type: null, required: false, default: "horizontal" },
    content: { type: Boolean, required: false, default: true },
    labelKey: { type: String, required: false, default: "label" },
    class: { type: null, required: false },
    ui: { type: null, required: false },
    defaultValue: { type: null, required: false, default: "0" },
    modelValue: { type: null, required: false },
    activationMode: { type: String, required: false },
    unmountOnHide: { type: Boolean, required: false, default: true }
  },
  emits: ["update:modelValue"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const slots = vueExports.useSlots();
    const appConfig = useAppConfig();
    const rootProps = useForwardPropsEmits(reactivePick(props, "as", "modelValue", "defaultValue", "orientation", "activationMode", "unmountOnHide"), emits);
    const ui = vueExports.computed(() => tv({ extend: tv(theme), ...appConfig.ui?.tabs || {} })({
      color: props.color,
      variant: props.variant,
      size: props.size,
      orientation: props.orientation
    }));
    const triggersRef = vueExports.ref([]);
    __expose({
      triggersRef
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(TabsRoot_default), vueExports.mergeProps(vueExports.unref(rootProps), {
        class: ui.value.root({ class: [props.ui?.root, props.class] })
      }, _attrs), {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(TabsList_default), {
              class: ui.value.list({ class: props.ui?.list })
            }, {
              default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(TabsIndicator_default), {
                    class: ui.value.indicator({ class: props.ui?.indicator })
                  }, null, _parent3, _scopeId2));
                  serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "list-leading", {}, null, _push3, _parent3, _scopeId2);
                  _push3(`<!--[-->`);
                  serverRenderer_cjs_prodExports.ssrRenderList(__props.items, (item, index) => {
                    _push3(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(TabsTrigger_default), {
                      key: index,
                      ref_for: true,
                      ref: (el) => triggersRef.value[index] = el,
                      value: item.value ?? String(index),
                      disabled: item.disabled,
                      class: ui.value.trigger({ class: [props.ui?.trigger, item.ui?.trigger] })
                    }, {
                      default: vueExports.withCtx((_3, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "leading", {
                            item,
                            index
                          }, () => {
                            if (item.icon) {
                              _push4(serverRenderer_cjs_prodExports.ssrRenderComponent(_sfc_main$5, {
                                name: item.icon,
                                class: ui.value.leadingIcon({ class: [props.ui?.leadingIcon, item.ui?.leadingIcon] })
                              }, null, _parent4, _scopeId3));
                            } else if (item.avatar) {
                              _push4(serverRenderer_cjs_prodExports.ssrRenderComponent(_sfc_main$3$1, vueExports.mergeProps({
                                size: item.ui?.leadingAvatarSize || props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                              }, { ref_for: true }, item.avatar, {
                                class: ui.value.leadingAvatar({ class: [props.ui?.leadingAvatar, item.ui?.leadingAvatar] })
                              }), null, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                          }, _push4, _parent4, _scopeId3);
                          if (vueExports.unref(get)(item, props.labelKey) || !!slots.default) {
                            _push4(`<span class="${serverRenderer_cjs_prodExports.ssrRenderClass(ui.value.label({ class: [props.ui?.label, item.ui?.label] }))}"${_scopeId3}>`);
                            serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "default", {
                              item,
                              index
                            }, () => {
                              _push4(`${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(get)(item, props.labelKey))}`);
                            }, _push4, _parent4, _scopeId3);
                            _push4(`</span>`);
                          } else {
                            _push4(`<!---->`);
                          }
                          serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "trailing", {
                            item,
                            index
                          }, () => {
                            if (item.badge !== void 0) {
                              _push4(serverRenderer_cjs_prodExports.ssrRenderComponent(_sfc_main$2, vueExports.mergeProps({
                                color: "neutral",
                                variant: "outline",
                                size: item.ui?.trailingBadgeSize || props.ui?.trailingBadgeSize || ui.value.trailingBadgeSize()
                              }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                                class: ui.value.trailingBadge({ class: [props.ui?.trailingBadge, item.ui?.trailingBadge] })
                              }), null, _parent4, _scopeId3));
                            } else {
                              _push4(`<!---->`);
                            }
                          }, _push4, _parent4, _scopeId3);
                        } else {
                          return [
                            vueExports.renderSlot(_ctx.$slots, "leading", {
                              item,
                              index
                            }, () => [
                              item.icon ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$5, {
                                key: 0,
                                name: item.icon,
                                class: ui.value.leadingIcon({ class: [props.ui?.leadingIcon, item.ui?.leadingIcon] })
                              }, null, 8, ["name", "class"])) : item.avatar ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$3$1, vueExports.mergeProps({
                                key: 1,
                                size: item.ui?.leadingAvatarSize || props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                              }, { ref_for: true }, item.avatar, {
                                class: ui.value.leadingAvatar({ class: [props.ui?.leadingAvatar, item.ui?.leadingAvatar] })
                              }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
                            ]),
                            vueExports.unref(get)(item, props.labelKey) || !!slots.default ? (vueExports.openBlock(), vueExports.createBlock("span", {
                              key: 0,
                              class: ui.value.label({ class: [props.ui?.label, item.ui?.label] })
                            }, [
                              vueExports.renderSlot(_ctx.$slots, "default", {
                                item,
                                index
                              }, () => [
                                vueExports.createTextVNode(vueExports.toDisplayString(vueExports.unref(get)(item, props.labelKey)), 1)
                              ])
                            ], 2)) : vueExports.createCommentVNode("", true),
                            vueExports.renderSlot(_ctx.$slots, "trailing", {
                              item,
                              index
                            }, () => [
                              item.badge !== void 0 ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$2, vueExports.mergeProps({
                                key: 0,
                                color: "neutral",
                                variant: "outline",
                                size: item.ui?.trailingBadgeSize || props.ui?.trailingBadgeSize || ui.value.trailingBadgeSize()
                              }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                                class: ui.value.trailingBadge({ class: [props.ui?.trailingBadge, item.ui?.trailingBadge] })
                              }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
                            ])
                          ];
                        }
                      }),
                      _: 2
                    }, _parent3, _scopeId2));
                  });
                  _push3(`<!--]-->`);
                  serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, "list-trailing", {}, null, _push3, _parent3, _scopeId2);
                } else {
                  return [
                    vueExports.createVNode(vueExports.unref(TabsIndicator_default), {
                      class: ui.value.indicator({ class: props.ui?.indicator })
                    }, null, 8, ["class"]),
                    vueExports.renderSlot(_ctx.$slots, "list-leading"),
                    (vueExports.openBlock(true), vueExports.createBlock(vueExports.Fragment, null, vueExports.renderList(__props.items, (item, index) => {
                      return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(TabsTrigger_default), {
                        key: index,
                        ref_for: true,
                        ref: (el) => triggersRef.value[index] = el,
                        value: item.value ?? String(index),
                        disabled: item.disabled,
                        class: ui.value.trigger({ class: [props.ui?.trigger, item.ui?.trigger] })
                      }, {
                        default: vueExports.withCtx(() => [
                          vueExports.renderSlot(_ctx.$slots, "leading", {
                            item,
                            index
                          }, () => [
                            item.icon ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$5, {
                              key: 0,
                              name: item.icon,
                              class: ui.value.leadingIcon({ class: [props.ui?.leadingIcon, item.ui?.leadingIcon] })
                            }, null, 8, ["name", "class"])) : item.avatar ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$3$1, vueExports.mergeProps({
                              key: 1,
                              size: item.ui?.leadingAvatarSize || props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                            }, { ref_for: true }, item.avatar, {
                              class: ui.value.leadingAvatar({ class: [props.ui?.leadingAvatar, item.ui?.leadingAvatar] })
                            }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
                          ]),
                          vueExports.unref(get)(item, props.labelKey) || !!slots.default ? (vueExports.openBlock(), vueExports.createBlock("span", {
                            key: 0,
                            class: ui.value.label({ class: [props.ui?.label, item.ui?.label] })
                          }, [
                            vueExports.renderSlot(_ctx.$slots, "default", {
                              item,
                              index
                            }, () => [
                              vueExports.createTextVNode(vueExports.toDisplayString(vueExports.unref(get)(item, props.labelKey)), 1)
                            ])
                          ], 2)) : vueExports.createCommentVNode("", true),
                          vueExports.renderSlot(_ctx.$slots, "trailing", {
                            item,
                            index
                          }, () => [
                            item.badge !== void 0 ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$2, vueExports.mergeProps({
                              key: 0,
                              color: "neutral",
                              variant: "outline",
                              size: item.ui?.trailingBadgeSize || props.ui?.trailingBadgeSize || ui.value.trailingBadgeSize()
                            }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                              class: ui.value.trailingBadge({ class: [props.ui?.trailingBadge, item.ui?.trailingBadge] })
                            }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
                          ])
                        ]),
                        _: 2
                      }, 1032, ["value", "disabled", "class"]);
                    }), 128)),
                    vueExports.renderSlot(_ctx.$slots, "list-trailing")
                  ];
                }
              }),
              _: 3
            }, _parent2, _scopeId));
            if (!!__props.content) {
              _push2(`<!--[-->`);
              serverRenderer_cjs_prodExports.ssrRenderList(__props.items, (item, index) => {
                _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(vueExports.unref(TabsContent_default), {
                  key: index,
                  value: item.value ?? String(index),
                  class: ui.value.content({ class: [props.ui?.content, item.ui?.content, item.class] })
                }, {
                  default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                    if (_push3) {
                      serverRenderer_cjs_prodExports.ssrRenderSlot(_ctx.$slots, item.slot || "content", {
                        item,
                        index
                      }, () => {
                        _push3(`${serverRenderer_cjs_prodExports.ssrInterpolate(item.content)}`);
                      }, _push3, _parent3, _scopeId2);
                    } else {
                      return [
                        vueExports.renderSlot(_ctx.$slots, item.slot || "content", {
                          item,
                          index
                        }, () => [
                          vueExports.createTextVNode(vueExports.toDisplayString(item.content), 1)
                        ])
                      ];
                    }
                  }),
                  _: 2
                }, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              vueExports.createVNode(vueExports.unref(TabsList_default), {
                class: ui.value.list({ class: props.ui?.list })
              }, {
                default: vueExports.withCtx(() => [
                  vueExports.createVNode(vueExports.unref(TabsIndicator_default), {
                    class: ui.value.indicator({ class: props.ui?.indicator })
                  }, null, 8, ["class"]),
                  vueExports.renderSlot(_ctx.$slots, "list-leading"),
                  (vueExports.openBlock(true), vueExports.createBlock(vueExports.Fragment, null, vueExports.renderList(__props.items, (item, index) => {
                    return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(TabsTrigger_default), {
                      key: index,
                      ref_for: true,
                      ref: (el) => triggersRef.value[index] = el,
                      value: item.value ?? String(index),
                      disabled: item.disabled,
                      class: ui.value.trigger({ class: [props.ui?.trigger, item.ui?.trigger] })
                    }, {
                      default: vueExports.withCtx(() => [
                        vueExports.renderSlot(_ctx.$slots, "leading", {
                          item,
                          index
                        }, () => [
                          item.icon ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$5, {
                            key: 0,
                            name: item.icon,
                            class: ui.value.leadingIcon({ class: [props.ui?.leadingIcon, item.ui?.leadingIcon] })
                          }, null, 8, ["name", "class"])) : item.avatar ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$3$1, vueExports.mergeProps({
                            key: 1,
                            size: item.ui?.leadingAvatarSize || props.ui?.leadingAvatarSize || ui.value.leadingAvatarSize()
                          }, { ref_for: true }, item.avatar, {
                            class: ui.value.leadingAvatar({ class: [props.ui?.leadingAvatar, item.ui?.leadingAvatar] })
                          }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
                        ]),
                        vueExports.unref(get)(item, props.labelKey) || !!slots.default ? (vueExports.openBlock(), vueExports.createBlock("span", {
                          key: 0,
                          class: ui.value.label({ class: [props.ui?.label, item.ui?.label] })
                        }, [
                          vueExports.renderSlot(_ctx.$slots, "default", {
                            item,
                            index
                          }, () => [
                            vueExports.createTextVNode(vueExports.toDisplayString(vueExports.unref(get)(item, props.labelKey)), 1)
                          ])
                        ], 2)) : vueExports.createCommentVNode("", true),
                        vueExports.renderSlot(_ctx.$slots, "trailing", {
                          item,
                          index
                        }, () => [
                          item.badge !== void 0 ? (vueExports.openBlock(), vueExports.createBlock(_sfc_main$2, vueExports.mergeProps({
                            key: 0,
                            color: "neutral",
                            variant: "outline",
                            size: item.ui?.trailingBadgeSize || props.ui?.trailingBadgeSize || ui.value.trailingBadgeSize()
                          }, { ref_for: true }, typeof item.badge === "string" || typeof item.badge === "number" ? { label: item.badge } : item.badge, {
                            class: ui.value.trailingBadge({ class: [props.ui?.trailingBadge, item.ui?.trailingBadge] })
                          }), null, 16, ["size", "class"])) : vueExports.createCommentVNode("", true)
                        ])
                      ]),
                      _: 2
                    }, 1032, ["value", "disabled", "class"]);
                  }), 128)),
                  vueExports.renderSlot(_ctx.$slots, "list-trailing")
                ]),
                _: 3
              }, 8, ["class"]),
              !!__props.content ? (vueExports.openBlock(true), vueExports.createBlock(vueExports.Fragment, { key: 0 }, vueExports.renderList(__props.items, (item, index) => {
                return vueExports.openBlock(), vueExports.createBlock(vueExports.unref(TabsContent_default), {
                  key: index,
                  value: item.value ?? String(index),
                  class: ui.value.content({ class: [props.ui?.content, item.ui?.content, item.class] })
                }, {
                  default: vueExports.withCtx(() => [
                    vueExports.renderSlot(_ctx.$slots, item.slot || "content", {
                      item,
                      index
                    }, () => [
                      vueExports.createTextVNode(vueExports.toDisplayString(item.content), 1)
                    ])
                  ]),
                  _: 2
                }, 1032, ["value", "class"]);
              }), 128)) : vueExports.createCommentVNode("", true)
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../../../node_modules/.pnpm/@nuxt+ui@3.3.7_@babel+parser@7.29.0_aws4fetch@1.0.20_change-case@5.4.4_db0@0.3.4_@electric-sq_lsgvwuiikzww5c3ye2c3t3uj2i/node_modules/@nuxt/ui/dist/runtime/components/Tabs.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ vueExports.defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute$1();
    const projectId = route.params.id;
    const project = vueExports.ref({
      id: projectId,
      name: "My Store",
      slug: "my-store",
      status: "active",
      url: "https://my-store.cjs.app",
      region: "GCC (Riyadh)",
      repo: "user/my-store"
    });
    const deployments = vueExports.ref([
      { id: "d1", status: "ready", branch: "main", commit: "a1b2c3d", message: "Update product catalog", duration: "42s", createdAt: "2 min ago" },
      { id: "d2", status: "ready", branch: "main", commit: "e4f5g6h", message: "Fix checkout flow", duration: "38s", createdAt: "1 hour ago" },
      { id: "d3", status: "failed", branch: "feat/new-theme", commit: "i7j8k9l", message: "Add new theme", duration: "15s", createdAt: "3 hours ago" }
    ]);
    const tabs = [
      { label: "Deployments", value: "deployments" },
      { label: "Environment", value: "env" },
      { label: "Domains", value: "domains" },
      { label: "Settings", value: "settings" }
    ];
    const activeTab = vueExports.ref("deployments");
    const statusColor = (status) => {
      switch (status) {
        case "ready":
          return "success";
        case "building":
          return "warning";
        case "failed":
          return "error";
        default:
          return "neutral";
      }
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UBadge = _sfc_main$2;
      const _component_UIcon = _sfc_main$5;
      const _component_UButton = _sfc_main$3;
      const _component_UTabs = _sfc_main$1;
      const _component_UCard = _sfc_main$4;
      const _component_UInput = _sfc_main$6;
      const _component_UDivider = vueExports.resolveComponent("UDivider");
      const _component_UFormField = _sfc_main$1$1;
      _push(`<div${serverRenderer_cjs_prodExports.ssrRenderAttrs(_attrs)}><div class="flex items-start justify-between mb-6"><div><div class="flex items-center gap-3"><h1 class="text-2xl font-bold text-white">${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(project).name)}</h1>`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UBadge, {
        color: "success",
        variant: "subtle",
        size: "xs"
      }, {
        default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(project).status)}`);
          } else {
            return [
              vueExports.createTextVNode(vueExports.toDisplayString(vueExports.unref(project).status), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="flex items-center gap-4 mt-2 text-sm text-gray-400"><span class="flex items-center gap-1">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UIcon, {
        name: "i-lucide-globe",
        class: "size-4"
      }, null, _parent));
      _push(` ${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(project).url)}</span><span class="flex items-center gap-1">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UIcon, {
        name: "i-simple-icons-github",
        class: "size-4"
      }, null, _parent));
      _push(` ${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(project).repo)}</span><span class="flex items-center gap-1">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UIcon, {
        name: "i-lucide-map-pin",
        class: "size-4"
      }, null, _parent));
      _push(` ${serverRenderer_cjs_prodExports.ssrInterpolate(vueExports.unref(project).region)}</span></div></div><div class="flex gap-2">`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
        variant: "outline",
        color: "neutral",
        icon: "i-lucide-external-link",
        label: "Visit"
      }, null, _parent));
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
        color: "primary",
        icon: "i-lucide-rocket",
        label: "Deploy"
      }, null, _parent));
      _push(`</div></div>`);
      _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UTabs, {
        items: tabs,
        modelValue: vueExports.unref(activeTab),
        "onUpdate:modelValue": ($event) => vueExports.isRef(activeTab) ? activeTab.value = $event : null,
        class: "mb-6"
      }, null, _parent));
      if (vueExports.unref(activeTab) === "deployments") {
        _push(`<div class="space-y-3"><!--[-->`);
        serverRenderer_cjs_prodExports.ssrRenderList(vueExports.unref(deployments), (deploy) => {
          _push(`<div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors"><div class="flex items-center gap-4">`);
          _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UBadge, {
            color: statusColor(deploy.status),
            variant: "subtle",
            size: "xs"
          }, {
            default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${serverRenderer_cjs_prodExports.ssrInterpolate(deploy.status)}`);
              } else {
                return [
                  vueExports.createTextVNode(vueExports.toDisplayString(deploy.status), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<div><p class="text-sm text-white font-medium">${serverRenderer_cjs_prodExports.ssrInterpolate(deploy.message)}</p><p class="text-xs text-gray-500 mt-0.5"><span class="font-mono">${serverRenderer_cjs_prodExports.ssrInterpolate(deploy.branch)}</span> · <span class="font-mono">${serverRenderer_cjs_prodExports.ssrInterpolate(deploy.commit)}</span> · ${serverRenderer_cjs_prodExports.ssrInterpolate(deploy.duration)}</p></div></div><span class="text-xs text-gray-500">${serverRenderer_cjs_prodExports.ssrInterpolate(deploy.createdAt)}</span></div>`);
        });
        _push(`<!--]--></div>`);
      } else if (vueExports.unref(activeTab) === "env") {
        _push(`<div>`);
        _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UCard, { class: "bg-gray-900 border-gray-800" }, {
          default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="space-y-3"${_scopeId}><div class="flex items-center gap-3"${_scopeId}>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                placeholder: "KEY",
                class: "flex-1 font-mono"
              }, null, _parent2, _scopeId));
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                placeholder: "value",
                class: "flex-1 font-mono",
                type: "password"
              }, null, _parent2, _scopeId));
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
                icon: "i-lucide-plus",
                color: "primary",
                variant: "ghost"
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UDivider, null, null, _parent2, _scopeId));
              _push2(`<div class="flex items-center justify-between py-2"${_scopeId}><code class="text-sm text-gray-300"${_scopeId}>DATABASE_URL</code><div class="flex items-center gap-2"${_scopeId}><code class="text-sm text-gray-500"${_scopeId}>••••••••</code>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
                icon: "i-lucide-eye",
                variant: "ghost",
                color: "neutral",
                size: "xs"
              }, null, _parent2, _scopeId));
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
                icon: "i-lucide-trash-2",
                variant: "ghost",
                color: "error",
                size: "xs"
              }, null, _parent2, _scopeId));
              _push2(`</div></div></div>`);
            } else {
              return [
                vueExports.createVNode("div", { class: "space-y-3" }, [
                  vueExports.createVNode("div", { class: "flex items-center gap-3" }, [
                    vueExports.createVNode(_component_UInput, {
                      placeholder: "KEY",
                      class: "flex-1 font-mono"
                    }),
                    vueExports.createVNode(_component_UInput, {
                      placeholder: "value",
                      class: "flex-1 font-mono",
                      type: "password"
                    }),
                    vueExports.createVNode(_component_UButton, {
                      icon: "i-lucide-plus",
                      color: "primary",
                      variant: "ghost"
                    })
                  ]),
                  vueExports.createVNode(_component_UDivider),
                  vueExports.createVNode("div", { class: "flex items-center justify-between py-2" }, [
                    vueExports.createVNode("code", { class: "text-sm text-gray-300" }, "DATABASE_URL"),
                    vueExports.createVNode("div", { class: "flex items-center gap-2" }, [
                      vueExports.createVNode("code", { class: "text-sm text-gray-500" }, "••••••••"),
                      vueExports.createVNode(_component_UButton, {
                        icon: "i-lucide-eye",
                        variant: "ghost",
                        color: "neutral",
                        size: "xs"
                      }),
                      vueExports.createVNode(_component_UButton, {
                        icon: "i-lucide-trash-2",
                        variant: "ghost",
                        color: "error",
                        size: "xs"
                      })
                    ])
                  ])
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (vueExports.unref(activeTab) === "domains") {
        _push(`<div>`);
        _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UCard, { class: "bg-gray-900 border-gray-800" }, {
          default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="space-y-4"${_scopeId}><div class="flex items-center gap-3"${_scopeId}>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                placeholder: "store.example.com",
                class: "flex-1",
                size: "lg"
              }, null, _parent2, _scopeId));
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
                label: "Add Domain",
                color: "primary"
              }, null, _parent2, _scopeId));
              _push2(`</div><div class="flex items-center justify-between py-3 border-t border-gray-800"${_scopeId}><div${_scopeId}><p class="text-sm text-white font-medium"${_scopeId}> my-store.cjs.app </p><p class="text-xs text-gray-500"${_scopeId}> Default domain </p></div>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UBadge, {
                color: "success",
                variant: "subtle",
                size: "xs"
              }, {
                default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(` Active `);
                  } else {
                    return [
                      vueExports.createTextVNode(" Active ")
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div></div>`);
            } else {
              return [
                vueExports.createVNode("div", { class: "space-y-4" }, [
                  vueExports.createVNode("div", { class: "flex items-center gap-3" }, [
                    vueExports.createVNode(_component_UInput, {
                      placeholder: "store.example.com",
                      class: "flex-1",
                      size: "lg"
                    }),
                    vueExports.createVNode(_component_UButton, {
                      label: "Add Domain",
                      color: "primary"
                    })
                  ]),
                  vueExports.createVNode("div", { class: "flex items-center justify-between py-3 border-t border-gray-800" }, [
                    vueExports.createVNode("div", null, [
                      vueExports.createVNode("p", { class: "text-sm text-white font-medium" }, " my-store.cjs.app "),
                      vueExports.createVNode("p", { class: "text-xs text-gray-500" }, " Default domain ")
                    ]),
                    vueExports.createVNode(_component_UBadge, {
                      color: "success",
                      variant: "subtle",
                      size: "xs"
                    }, {
                      default: vueExports.withCtx(() => [
                        vueExports.createTextVNode(" Active ")
                      ]),
                      _: 1
                    })
                  ])
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (vueExports.unref(activeTab) === "settings") {
        _push(`<div>`);
        _push(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UCard, { class: "bg-gray-900 border-gray-800" }, {
          default: vueExports.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="space-y-6"${_scopeId}>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UFormField, { label: "Project Name" }, {
                default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                      "model-value": vueExports.unref(project).name,
                      size: "lg"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      vueExports.createVNode(_component_UInput, {
                        "model-value": vueExports.unref(project).name,
                        size: "lg"
                      }, null, 8, ["model-value"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UFormField, { label: "Git Repository" }, {
                default: vueExports.withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UInput, {
                      "model-value": vueExports.unref(project).repo,
                      size: "lg",
                      icon: "i-simple-icons-github"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      vueExports.createVNode(_component_UInput, {
                        "model-value": vueExports.unref(project).repo,
                        size: "lg",
                        icon: "i-simple-icons-github"
                      }, null, 8, ["model-value"])
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UDivider, null, null, _parent2, _scopeId));
              _push2(`<div class="pt-2"${_scopeId}><h3 class="text-sm font-medium text-red-400 mb-2"${_scopeId}> Danger Zone </h3>`);
              _push2(serverRenderer_cjs_prodExports.ssrRenderComponent(_component_UButton, {
                color: "error",
                variant: "outline",
                label: "Delete Project",
                icon: "i-lucide-trash-2"
              }, null, _parent2, _scopeId));
              _push2(`</div></div>`);
            } else {
              return [
                vueExports.createVNode("div", { class: "space-y-6" }, [
                  vueExports.createVNode(_component_UFormField, { label: "Project Name" }, {
                    default: vueExports.withCtx(() => [
                      vueExports.createVNode(_component_UInput, {
                        "model-value": vueExports.unref(project).name,
                        size: "lg"
                      }, null, 8, ["model-value"])
                    ]),
                    _: 1
                  }),
                  vueExports.createVNode(_component_UFormField, { label: "Git Repository" }, {
                    default: vueExports.withCtx(() => [
                      vueExports.createVNode(_component_UInput, {
                        "model-value": vueExports.unref(project).repo,
                        size: "lg",
                        icon: "i-simple-icons-github"
                      }, null, 8, ["model-value"])
                    ]),
                    _: 1
                  }),
                  vueExports.createVNode(_component_UDivider),
                  vueExports.createVNode("div", { class: "pt-2" }, [
                    vueExports.createVNode("h3", { class: "text-sm font-medium text-red-400 mb-2" }, " Danger Zone "),
                    vueExports.createVNode(_component_UButton, {
                      color: "error",
                      variant: "outline",
                      label: "Delete Project",
                      icon: "i-lucide-trash-2"
                    })
                  ])
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vueExports.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/projects/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-CtnFTZ0e.mjs.map
