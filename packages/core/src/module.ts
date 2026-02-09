import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImportsDir,
  addServerHandler,
  addTypeTemplate,
  addServerPlugin,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { consola } from 'consola'

const logger = consola.withTag('@commercejs/core')

export interface CommerceModuleOptions {
  /**
   * The adapter to use (e.g., 'salla', 'zid', 'shopify', 'medusa').
   * The adapter package must be installed separately.
   */
  adapter?: string

  /**
   * Base path for auto-generated REST API routes.
   * @default '/api/_commerce'
   */
  apiBase?: string

  /**
   * Whether to register auto-generated REST API routes.
   * @default true
   */
  apiRoutes?: boolean
}

const commerceModule: NuxtModule<CommerceModuleOptions> = defineNuxtModule<CommerceModuleOptions>({
  meta: {
    name: '@commercejs/core',
    configKey: 'commerce',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    apiBase: '/api/_commerce',
    apiRoutes: true,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    logger.info('Initializing CommerceJS module...')

    // Expose options via runtime config
    nuxt.options.runtimeConfig.public.commerce = {
      adapter: options.adapter || '',
      apiBase: options.apiBase || '/api/_commerce',
    }

    // Add type augmentation for $commerce on NuxtApp
    addTypeTemplate({
      filename: 'types/commercejs.d.ts',
      getContents: () => `
        import type { CommerceAdapter } from '@commercejs/types'

        declare module '#app' {
          interface NuxtApp {
            $commerce: CommerceAdapter
          }
        }

        declare module 'vue' {
          interface ComponentCustomProperties {
            $commerce: CommerceAdapter
          }
        }

        export {}
      `,
    })

    // Register the plugin that provides the adapter instance
    addPlugin(resolve('./runtime/plugin'))

    // Register the Nitro server plugin that injects the adapter into event.context
    addServerPlugin(resolve('./runtime/server/plugins/commerce-adapter'))

    // Auto-import composables
    addImportsDir(resolve('./runtime/composables'))

    // Register server API routes if enabled
    if (options.apiRoutes) {
      const apiBase = options.apiBase || '/api/_commerce'
      let routeCount = 0

      type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'

      const route = (path: string, handler: string, method?: HttpMethod) => {
        addServerHandler({
          route: `${apiBase}${path}`,
          handler: resolve(`./runtime/server/api/${handler}`),
          ...(method ? { method } : {}),
        })
        routeCount++
      }

      // ---- Store ----
      route('/store', 'store.get')

      // ---- Catalog ----
      route('/products', 'products.get')
      route('/products/:id', 'products.[id].get')
      route('/categories', 'categories.get')
      route('/brands', 'brands.get')

      // ---- Cart ----
      route('/cart', 'cart.post', 'post')
      route('/cart/:id', 'cart.[id].get')
      route('/cart/:id/items', 'cart.[id].items.post', 'post')
      route('/cart/:id/items/:itemId', 'cart.[id].items.[itemId].put', 'put')
      route('/cart/:id/items/:itemId', 'cart.[id].items.[itemId].delete', 'delete')

      // ---- Checkout ----
      route('/checkout/shipping-methods/:cartId', 'checkout.shipping-methods.[cartId].get')
      route('/checkout/payment-methods/:cartId', 'checkout.payment-methods.[cartId].get')
      route('/checkout/place-order', 'checkout.place-order.post', 'post')

      // ---- Auth ----
      route('/auth/login', 'auth.login.post', 'post')
      route('/auth/register', 'auth.register.post', 'post')
      route('/auth/logout', 'auth.logout.post', 'post')
      route('/auth/forgot-password', 'auth.forgot-password.post', 'post')
      route('/auth/reset-password', 'auth.reset-password.post', 'post')

      // ---- Customer ----
      route('/customer', 'customer.get')
      route('/customer/orders', 'customer.orders.get')
      route('/customer/addresses', 'customer.addresses.get')
      route('/customer/addresses', 'customer.addresses.post', 'post')
      route('/customer/addresses/:addressId', 'customer.addresses.[addressId].put', 'put')
      route('/customer/addresses/:addressId', 'customer.addresses.[addressId].delete', 'delete')

      // ---- Reviews ----
      route('/reviews/:productId', 'reviews.[productId].get')
      route('/reviews/:productId/summary', 'reviews.[productId].summary.get')
      route('/reviews', 'reviews.post', 'post')

      // ---- Wishlist ----
      route('/wishlist', 'wishlist.get')
      route('/wishlist/items', 'wishlist.items.post', 'post')
      route('/wishlist/items/:itemId', 'wishlist.items.[itemId].delete', 'delete')

      // ---- Promotions ----
      route('/promotions', 'promotions.get')
      route('/promotions/validate', 'promotions.validate.post', 'post')

      // ---- Returns ----
      route('/returns', 'returns.get')
      route('/returns', 'returns.post', 'post')
      route('/returns/:returnId', 'returns.[returnId].get')
      route('/returns/:returnId/cancel', 'returns.[returnId].cancel.post', 'post')

      // ---- Countries & Locations ----
      route('/countries', 'countries.get')
      route('/locations', 'locations.get')

      logger.info(`Registered ${routeCount} REST API routes under ${apiBase}`)
    }
  },
})

export default commerceModule
