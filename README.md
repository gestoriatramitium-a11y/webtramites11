# Tramitium — versión corregida con Stripe real + EmailJS

Esta versión corrige el fallo principal de tu código anterior: `stripe.createPaymentMethod()` **no cobra dinero**. Solo crea un método de pago/token. Para cobrar de verdad hace falta crear un `PaymentIntent` en un servidor y confirmarlo desde el navegador.

## Estructura

- `index.html` — web completa.
- `netlify/functions/create-payment-intent.js` — crea el PaymentIntent con la clave secreta de Stripe.
- `netlify/functions/send-order-email.js` — verifica que el pago está `succeeded` antes de enviar el email de pedido.
- `netlify/functions/send-contact-email.js` — envía consultas de contacto.
- `netlify/functions/_services.js` — precios validados en servidor.
- `.env.example` — variables necesarias.

## Pasos para ponerlo en marcha

### 1. Stripe

Usa primero modo test.

En `index.html`, cambia:

```js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_REEMPLAZA_ESTO_POR_TU_CLAVE_PUBLICABLE';
```

por tu clave publicable de Stripe `pk_test_...`.

En Netlify, añade la variable de entorno:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

Cuando todo funcione, cambia a `pk_live_...` y `sk_live_...`.

### 2. EmailJS

En tu plantilla de EmailJS usa estas variables:

```text
{{service_title}}
{{service_tag}}
{{price}}
{{reference}}
{{client_email}}
{{form_data}}
{{payment_id}}
{{reply_to}}
{{admin_email}}
```

En Netlify añade:

```bash
EMAILJS_SERVICE_ID=service_xxxxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxxxx
EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxx
EMAILJS_PRIVATE_KEY=
ADMIN_EMAIL=gestoriatramitium@gmail.com
```

`EMAILJS_PRIVATE_KEY` es opcional, pero si tu cuenta lo permite es recomendable.

### 3. Despliegue en Netlify

Sube este proyecto a Netlify. Netlify detectará `netlify.toml` y usará las funciones serverless.

Para probar localmente:

```bash
npm install
cp .env.example .env
npx netlify dev
```

Abre la URL local que te indique Netlify.

## Por qué tu versión anterior no cobraba

Tu código hacía esto:

```js
stripe.createPaymentMethod(...)
```

Eso solo genera un `paymentMethod.id`. No ejecuta un cargo. Luego llamaba a EmailJS y mostraba pantalla de éxito aunque Stripe no hubiese cobrado nada.

La versión corregida hace esto:

1. Valida el formulario.
2. Crea un `PaymentIntent` en servidor.
3. Confirma el pago con `stripe.confirmCardPayment(...)`.
4. Solo si Stripe devuelve `status: 'succeeded'`, llama al servidor para enviar el email.
5. El servidor vuelve a verificar el pago en Stripe antes de mandar EmailJS.

## Importante

No pongas nunca `sk_live_...` ni `sk_test_...` dentro de `index.html`. La clave secreta debe ir solo en variables de entorno del servidor.

## Documentación adicional

Los formularios no solicitan poder ni autorización como adjunto. Si un trámite requiere documentación adicional, se solicita posteriormente por email.
