import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api.js'
import { Skeleton } from '@/components/ui/kit.jsx'

// Moyasar's official payment form (npm moyasar-payment-form 2.3.0, MIT), served from our own site under a fixed
// version so its look never changes underneath us. It loads only when a payment form is actually shown.
const BASE = '/vendor/moyasar/2.3.0/'
let loading
function loadMoyasar() {
  if (window.Moyasar) return Promise.resolve(window.Moyasar)
  return (loading ||= new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-moyasar]')) {
      const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: BASE + 'moyasar.css' })
      l.dataset.moyasar = ''
      document.head.appendChild(l)
    }
    const s = Object.assign(document.createElement('script'), { src: BASE + 'moyasar.umd.min.js', async: true })
    s.onload = () => (window.Moyasar ? resolve(window.Moyasar) : reject(new Error('moyasar')))
    s.onerror = () => { loading = null; reject(new Error('moyasar')) }
    document.head.appendChild(s)
  }))
}

/** The card / Apple Pay / STC Pay form for one pending order. The card goes from the browser straight to Moyasar;
 *  after paying (and the bank's 3-D Secure page) the customer comes back to /order/<id>?moyasar=1&id=<payment>. */
export default function MoyasarPay({ order, config }) {
  const box = useRef(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    let alive = true
    const amount = Math.round(Number(order.total) * 100) // halalas; Moyasar takes 1 SAR at least
    if (!(amount >= 100)) { setState('error'); return }
    setState('loading')
    loadMoyasar().then((Moyasar) => {
      if (!alive || !box.current) return
      box.current.innerHTML = '' // a second mount (React StrictMode, a re-render) must not draw a second form
      Moyasar.init({
        element: box.current,
        amount,
        currency: 'SAR',
        description: `طلب منصة رائد #${order.number}`,
        publishable_api_key: config.publishableKey,
        callback_url: `${window.location.origin}/order/${order.id}?moyasar=1`,
        methods: ['creditcard', 'applepay', 'stcpay'],
        supported_networks: ['mada', 'visa', 'mastercard'],
        language: 'ar',
        fixed_width: false,
        metadata: { order_id: order.id, order_number: String(order.number) },
        apple_pay: { country: 'SA', label: 'Raed', // Moyasar takes English letters only here
          validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate' },
        // remember the payment before the bank's page, so a dropped connection can still be checked later
        on_completed: async (payment) => { await api.verifyMoyasar(order.id, payment.id).catch(() => {}) },
      })
      setState('ready')
    }).catch(() => alive && setState('error'))
    return () => { alive = false }
  }, [order.id, order.number, order.total, config.publishableKey])

  return (
    <div className="rr-pay">
      {state === 'loading' && <Skeleton className="h-64" />}
      {state === 'error' && <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">تعذّر تحميل نموذج الدفع، حدّث الصفحة</p>}
      <div ref={box} />
    </div>
  )
}
