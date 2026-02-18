export default defineAppConfig({
  ui: {
    colors: {
      primary: 'violet',
      neutral: 'zinc'
    },
    dashboardSidebar: {
      slots: {
        root: 'pb-4 bg-elevated/30',
        header: 'border-b border-default'
      },
      variants: {
        side: {
          left: {
            root: 'border-r border-default'
          }
        }
      }
    },
    dashboardNavbar: {
      slots: {
        root: 'border-b border-default px-4 sm:px-4'
      }
    },
    dashboardSearchButton: {
      slots: {
        base: 'bg-default py-2'
      }
    },
    navigationMenu: {
      variants: {
        orientation: {
          vertical: {
            link: 'py-2',
            list: 'space-y-1'
          }
        },
        active: {
          true: {
            link: 'bg-elevated rounded-md'
          }
        }
      }
    },
    card: {
      slots: {
        root: '!gap-0 flex flex-col justify-between',
        header: 'flex items-start justify-between p-6 pb-0 sm:px-6',
        footer: 'pt-0 sm:pt-0'
      },
      variants: {
        variant: {
          subtle: {
            root: 'shadow bg-default dark:bg-elevated/40 divide-none'
          }
        }
      },
      defaultVariants: {
        variant: 'subtle'
      }
    },
    table: {
      slots: {
        th: 'py-3 px-0 text-muted',
        td: 'py-2 px-0 text-toned',
        separator: 'bg-(--ui-border)'
      }
    },
    tabs: {
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'pill',
          class: {
            indicator: 'bg-default text-default shadow',
            list: 'bg-default dark:bg-elevated/40 border border-default',
            trigger: 'data-[state=active]:text-inverted data-[state=active]:bg-inverted'
          }
        }
      ]
    },
    input: {
      slots: {
        root: 'w-full'
      },
      defaultVariants: {
        color: 'neutral',
        variant: 'subtle'
      }
    },
    textarea: {
      slots: {
        root: 'w-full'
      },
      defaultVariants: {
        color: 'neutral',
        variant: 'subtle'
      }
    },
    select: {
      defaultVariants: {
        color: 'neutral',
        variant: 'subtle'
      }
    },
    button: {
      defaultVariants: {
        color: 'neutral',
        variant: 'subtle'
      }
    },
    badge: {
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'subtle',
          class: 'bg-default ring-muted/50'
        }
      ],
      defaultVariants: {
        color: 'neutral',
        variant: 'subtle'
      }
    },
    breadcrumb: {
      slots: {
        separatorIcon: 'text-dimmed',
        link: 'text-base'
      },
      variants: {
        active: {
          true: {
            link: 'text-default'
          }
        }
      }
    }
  }
})
