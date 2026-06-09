const Stripe = require('stripe');
const { SERVICES, jsonResponse, parseJson, isEmail, cleanText, formDataToText } = require('./_services');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método no permitido.' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return jsonResponse(500, { error: 'Falta STRIPE_SECRET_KEY en el servidor.' });
  }

  const body = parseJson(event);
  if (!body) return jsonResponse(400, { error: 'JSON inválido.' });

  const serviceKey = cleanText(body.serviceKey, 80);
  const service = SERVICES[serviceKey];
  if (!service) return jsonResponse(400, { error: 'Servicio no válido.' });

  const clientEmail = cleanText(body.clientEmail, 180);
  const reference = cleanText(body.reference, 60) || `TRM-${Date.now().toString().slice(-8)}`;
  const formDataText = formDataToText(body.formData).slice(0, 500);
  const hasAuthorization = Boolean(body.attachments && body.attachments.autorizacion);

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: service.price * 100,
      currency: 'eur',
      payment_method_types: ['card'],
      description: `${service.title} · ${reference}`,
      receipt_email: isEmail(clientEmail) ? clientEmail : undefined,
      metadata: {
        reference,
        service_key: serviceKey,
        service_title: service.title,
        client_email: clientEmail,
        form_data: formDataText || 'No indicado',
        has_authorization: hasAuthorization ? 'si' : 'no'
      }
    });

    return jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: service.price,
      currency: 'eur',
      reference
    });
  } catch (error) {
    console.error('Stripe create-payment-intent error:', error);
    return jsonResponse(500, { error: 'No se pudo iniciar el pago con Stripe.' });
  }
};
