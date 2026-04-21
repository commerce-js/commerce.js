// ---------------------------------------------------------------------------
// order-confirmation template — render smoke tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest'
import { renderEmail, getTemplateKeys } from '../_render'
import {
  orderConfirmationTemplate,
  type OrderConfirmationVars,
} from '../order-confirmation'

const baseVars: OrderConfirmationVars = {
  orderNumber: '#1024',
  buyerName: 'Layla',
  storeName: 'Acme Co',
  orderStatusUrl: 'https://acme.commercejs.cloud/order-confirmation?orderId=ord_abc',
  currency: 'BHD',
  totalFormatted: 'BHD 12.500',
  subtotalFormatted: 'BHD 10.000',
  shippingFormatted: 'BHD 2.000',
  taxFormatted: 'BHD 0.500',
  items: [
    {
      name: 'Saffron 10g',
      quantity: 2,
      totalFormatted: 'BHD 6.000',
      imageUrl: 'https://cdn.example.com/saffron.jpg',
    },
    {
      name: 'Rose Water 500ml',
      quantity: 1,
      totalFormatted: 'BHD 4.000',
      imageUrl: null,
    },
  ],
  shippingAddress: {
    firstName: 'Layla',
    lastName: 'Al Mansour',
    street: '123 Palm Street',
    street2: 'Apt 4',
    city: 'Manama',
    state: 'Capital Governorate',
    postalCode: '317',
    country: 'Bahrain',
  },
}

describe('registry', () => {
  it('registers the order-confirmation template', () => {
    expect(getTemplateKeys()).toContain('order-confirmation')
  })
})

describe('order-confirmation template', () => {
  it('produces subject + html + text with all key vars', () => {
    const out = renderEmail('order-confirmation', baseVars as any)
    expect(out.subject).toContain('#1024')
    expect(out.subject).toContain('Acme Co')
    expect(out.html).toContain('Layla')
    expect(out.html).toContain('Acme Co')
    expect(out.html).toContain('#1024')
    expect(out.html).toContain('Saffron 10g')
    expect(out.html).toContain('Rose Water 500ml')
    expect(out.html).toContain('BHD 12.500')
    expect(out.html).toContain(baseVars.orderStatusUrl)
    expect(out.text).toContain('Layla')
    expect(out.text).toContain('Saffron 10g')
    expect(out.text).toContain('BHD 12.500')
    expect(out.text).toContain(baseVars.orderStatusUrl)
  })

  it('falls back to "Hi there" when buyerName is missing', () => {
    const out = orderConfirmationTemplate.text({ ...baseVars, buyerName: null })
    expect(out).toMatch(/^Hi there,/)
  })

  it('includes shipping line when shippingFormatted is set', () => {
    const out = orderConfirmationTemplate.html(baseVars)
    expect(out).toContain('Shipping')
    expect(out).toContain('BHD 2.000')
  })

  it('omits shipping line when shippingFormatted is null', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      shippingFormatted: null,
    })
    // "Shipping to" header is still fine (address block); but the
    // totals-row "Shipping" should be gone.
    expect(out).not.toContain('>Shipping<')
  })

  it('omits tax line when taxFormatted is null', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      taxFormatted: null,
    })
    expect(out).not.toContain('>Tax<')
  })

  it('omits image tag when line item imageUrl is null', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      items: [{
        name: 'No-image product',
        quantity: 1,
        totalFormatted: 'BHD 1.000',
        imageUrl: null,
      }],
    })
    expect(out).not.toContain('<img')
    expect(out).toContain('No-image product')
  })

  it('omits shipping address block for digital-only orders', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      shippingAddress: null,
    })
    expect(out).not.toContain('Shipping to')
    expect(out).not.toContain('Palm Street')
  })

  it('escapes HTML in storeName to prevent injection', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      storeName: '<script>alert(1)</script>',
    })
    expect(out).not.toContain('<script>alert(1)</script>')
    expect(out).toContain('&lt;script&gt;')
  })

  it('escapes HTML in line-item name', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      items: [{
        name: '<img src=x onerror=alert(1)>',
        quantity: 1,
        totalFormatted: 'BHD 1.000',
        imageUrl: null,
      }],
    })
    expect(out).not.toContain('<img src=x onerror=alert(1)>')
    expect(out).toContain('&lt;img')
  })

  it('escapes HTML in buyerName', () => {
    const out = orderConfirmationTemplate.html({
      ...baseVars,
      buyerName: "<b>bold</b>",
    })
    expect(out).not.toContain('<b>bold</b>')
    expect(out).toContain('&lt;b&gt;bold')
  })

  it('renders text block cleanly without HTML tags', () => {
    const out = orderConfirmationTemplate.text(baseVars)
    expect(out).not.toContain('<')
    expect(out).not.toContain('&lt;')
  })

  it('single-line address renders when state/postalCode/street2 missing', () => {
    const out = orderConfirmationTemplate.text({
      ...baseVars,
      shippingAddress: {
        firstName: 'Khalid',
        lastName: 'Al Sabah',
        street: 'Main Rd',
        street2: null,
        city: 'Kuwait City',
        state: null,
        postalCode: null,
        country: 'Kuwait',
      },
    })
    expect(out).toContain('Khalid Al Sabah')
    expect(out).toContain('Main Rd')
    expect(out).toContain('Kuwait City')
    expect(out).toContain('Kuwait')
    // No extra dividers or empty comma runs.
    expect(out).not.toMatch(/,\s*,/)
  })
})
