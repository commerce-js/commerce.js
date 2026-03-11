// @commercejs/ui — Default theme configuration
// Follows Nuxt UI conventions: slots, variants, defaultVariants
// Users can override any of these in their own app.config.ts
//
// NOTE: We export the raw config object instead of using defineAppConfig()
// because this file ships via node_modules and the Nuxt auto-import
// transform that provides defineAppConfig may not apply in all SSR
// environments (e.g., Cloudflare Workers). defineAppConfig is an identity
// function used only for type inference, so exporting the object directly
// is functionally identical.

export default {
  ui: {
    // ---- Product Components ----

    productCard: {
      slots: {
        root: 'group relative rounded-lg overflow-hidden ring ring-default transition-all duration-200',
        imageWrapper: 'relative aspect-square overflow-hidden bg-elevated',
        image: 'size-full object-cover transition-transform duration-300 group-hover:scale-105',
        badge: 'absolute top-3 start-3 z-10',
        overlay: 'absolute inset-x-0 bottom-0 p-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10',
        body: 'p-4 space-y-1.5',
        title: 'font-medium text-sm text-highlighted line-clamp-2 transition-colors',
        price: 'font-bold text-highlighted',
        originalPrice: 'text-xs text-muted line-through ms-2',
        priceWrapper: 'flex items-baseline gap-1',
        rating: 'flex items-center gap-1 text-xs text-muted',
      },
      variants: {
        variant: {
          outline: { root: 'bg-default hover:shadow-lg hover:shadow-default/10' },
          soft: { root: 'bg-elevated/50 ring-0 hover:bg-elevated' },
          ghost: { root: 'ring-0 hover:bg-elevated/50' },
        },
        size: {
          sm: { body: 'p-3 space-y-1', title: 'text-xs', price: 'text-sm' },
          md: { body: 'p-4 space-y-1.5', title: 'text-sm', price: 'text-base' },
          lg: { body: 'p-5 space-y-2', title: 'text-base', price: 'text-lg' },
        },
      },
      defaultVariants: { variant: 'outline', size: 'md' },
    },

    productPrice: {
      slots: {
        root: 'inline-flex items-baseline gap-1.5',
        current: 'font-bold text-highlighted',
        original: 'line-through text-muted',
        discount: 'font-medium text-error',
      },
      variants: {
        size: {
          xs: { current: 'text-xs', original: 'text-xs', discount: 'text-xs' },
          sm: { current: 'text-sm', original: 'text-xs', discount: 'text-xs' },
          md: { current: 'text-base', original: 'text-sm', discount: 'text-sm' },
          lg: { current: 'text-lg', original: 'text-sm', discount: 'text-sm' },
          xl: { current: 'text-2xl', original: 'text-base', discount: 'text-base' },
        },
      },
      defaultVariants: { size: 'md' },
    },

    productGallery: {
      slots: {
        root: 'flex flex-col gap-3',
        main: 'relative rounded-lg overflow-hidden bg-elevated aspect-square',
        mainImage: 'size-full object-contain',
        thumbnails: 'flex gap-2 overflow-x-auto',
        thumbnail: 'size-16 rounded-md overflow-hidden ring ring-transparent cursor-pointer shrink-0 transition-all',
        thumbnailActive: 'ring-primary',
      },
      variants: {
        thumbnailPosition: {
          bottom: { root: 'flex-col' },
          start: { root: 'flex-row-reverse', thumbnails: 'flex-col overflow-y-auto max-h-[400px]' },
        },
      },
    },

    productOptions: {
      slots: {
        root: 'space-y-4',
        group: 'space-y-2',
        label: 'text-sm font-medium text-highlighted',
        values: 'flex flex-wrap gap-2',
      },
    },

    productGrid: {
      slots: {
        root: '',
        empty: '',
      },
    },

    // ---- Cart Components ----

    quantitySelector: {
      slots: {
        root: 'inline-flex items-center gap-0.5',
        button: '',
        input: 'w-10 text-center text-sm font-medium bg-transparent border-0 focus:ring-0 text-highlighted',
      },
      variants: {
        size: {
          sm: { input: 'w-8 text-xs' },
          md: { input: 'w-10 text-sm' },
          lg: { input: 'w-12 text-base' },
        },
      },
      defaultVariants: { size: 'md' },
    },

    cartItem: {
      slots: {
        root: 'flex gap-4',
        imageWrapper: 'shrink-0 rounded-lg overflow-hidden bg-elevated',
        image: 'size-full object-cover',
        body: 'flex-1 min-w-0',
        title: 'font-medium text-sm text-highlighted line-clamp-1',
        variant: 'text-xs text-muted',
        priceWrapper: 'mt-1',
        actions: 'flex items-center justify-between mt-2',
      },
      variants: {
        size: {
          sm: { imageWrapper: 'size-16', title: 'text-xs' },
          md: { imageWrapper: 'size-20', title: 'text-sm' },
          lg: { imageWrapper: 'size-24', title: 'text-base' },
        },
      },
      defaultVariants: { size: 'md' },
    },

    cartSummary: {
      slots: {
        root: 'space-y-4',
        title: 'text-lg font-semibold text-highlighted',
        lineItem: 'flex justify-between text-sm',
        lineLabel: 'text-muted',
        lineValue: 'font-medium text-highlighted',
        separator: '',
        total: 'flex justify-between text-base font-bold',
        totalLabel: 'text-highlighted',
        totalValue: 'text-highlighted',
        actions: 'pt-4',
      },
    },

    // ---- Checkout Components ----

    checkoutStepper: {
      slots: {
        root: '',
      },
    },

    addressForm: {
      slots: {
        root: 'space-y-4',
        row: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
        field: '',
      },
    },

    // ---- Review Components ----

    reviewStars: {
      slots: {
        root: '',
        star: '',
        starFilled: '',
        starEmpty: '',
        count: 'text-xs text-muted ms-1',
      },
    },

    reviewCard: {
      slots: {
        root: 'space-y-2',
        header: 'space-y-1',
        author: 'font-medium text-sm text-highlighted',
        date: 'text-xs text-muted',
        title: 'font-medium text-highlighted',
        body: 'text-sm text-muted leading-relaxed',
        verified: '',
      },
    },

    // ---- Navigation Components ----

    searchBar: {
      slots: {
        root: '',
      },
    },

    // ---- Category Components ----

    categoryFilter: {
      slots: {
        root: 'space-y-4',
        group: 'space-y-2',
        groupTitle: 'text-sm font-semibold text-highlighted',
        values: 'space-y-1.5',
        value: 'flex items-center gap-2 text-sm cursor-pointer',
        count: 'text-xs text-muted ms-auto',
        showMore: 'text-xs text-primary font-medium cursor-pointer hover:underline',
      },
    },

    // ---- Marketing Components ----

    heroBanner: {
      slots: {
        root: '',
        background: '',
        overlay: '',
        content: '',
        title: '',
        subtitle: '',
        actions: '',
      },
    },

    // ---- Common Components ----

    emptyState: {
      slots: {
        root: '',
        icon: '',
        title: '',
        description: '',
      },
    },

    // ---- Auction Components ----

    auctionCard: {
      slots: {
        root: '',
        imageWrapper: '',
        image: '',
        statusBadge: '',
        body: 'p-4 space-y-2',
        title: 'font-medium text-sm text-highlighted line-clamp-2',
        bidInfo: 'space-y-1',
        currentBid: 'font-bold text-lg text-highlighted',
        bidCount: 'text-xs text-muted',
        timer: '',
        actions: 'flex gap-2 pt-1',
      },
    },

    bidPanel: {
      slots: {
        root: 'space-y-6',
        currentBid: 'text-center p-6 rounded-xl bg-elevated ring ring-default',
        form: 'space-y-4',
        history: 'space-y-2',
      },
    },

    // ---- Rental Components ----

    rentalCard: {
      slots: {
        root: '',
        imageWrapper: '',
        image: '',
        body: 'p-4 space-y-2',
        title: 'font-medium text-sm text-highlighted line-clamp-2',
        pricing: 'flex items-baseline gap-1',
        meta: 'flex flex-wrap gap-2 text-xs',
        actions: '',
      },
    },

    rentalBookingForm: {
      slots: {
        root: 'space-y-5',
        dates: '',
        summary: 'rounded-xl bg-elevated p-4 space-y-2',
      },
    },

    // ---- Subscription Components ----

    subscriptionCard: {
      slots: {
        root: '',
        header: 'text-center',
        pricing: 'text-center py-4',
        features: '',
        actions: '',
      },
    },

    // ---- Wholesale Components ----

    priceTierTable: {
      slots: {
        root: 'overflow-hidden rounded-lg ring ring-default',
        row: '',
        activeRow: 'bg-primary/5 font-medium',
      },
    },

    quoteRequestForm: {
      slots: {
        root: 'space-y-6',
        items: 'space-y-4',
        contact: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
      },
    },

    // ---- Gift Card Components ----

    giftCardForm: {
      slots: {
        root: 'space-y-6',
        amounts: 'space-y-3',
        recipient: 'space-y-3',
      },
    },

    giftCardBalance: {
      slots: {
        root: 'space-y-4',
        card: 'rounded-xl bg-elevated ring ring-default p-5 space-y-3',
        form: 'flex gap-2',
      },
    },

    // ---- Order Components ----

    orderCard: {
      slots: {
        root: 'rounded-xl ring ring-default bg-default overflow-hidden',
        header: 'flex items-center justify-between px-5 py-3 bg-elevated',
        items: 'px-5 py-4',
        footer: 'flex items-center justify-between px-5 py-3 bg-elevated',
      },
    },

    orderTimeline: {
      slots: {
        root: 'relative',
        entry: 'flex gap-4 pb-6 last:pb-0',
        dot: 'size-8 rounded-full flex items-center justify-center ring-4 ring-default bg-default z-10',
        line: 'w-0.5 flex-1 bg-default mt-1',
      },
    },

    // ---- Promotion Components ----

    promoBanner: {
      slots: {
        root: 'relative overflow-hidden rounded-xl',
        content: '',
        timer: 'flex gap-2',
        cta: '',
      },
    },

    couponInput: {
      slots: {
        root: 'space-y-2',
        input: 'flex-1 font-mono uppercase',
        applied: 'flex items-center justify-between p-3 rounded-lg bg-success/10 ring ring-success/30',
      },
    },

    // ---- Event Components ----

    eventCard: {
      slots: {
        root: '',
        imageWrapper: '',
        dateOverlay: '',
        body: 'p-4 space-y-2',
        title: 'font-medium text-sm text-highlighted line-clamp-2',
        meta: 'space-y-1 text-xs text-muted',
        actions: '',
      },
    },

    // ---- Wishlist Components ----

    wishlistGrid: {
      slots: {
        root: '',
        item: 'relative group',
        actions: '',
      },
    },
  },
}
