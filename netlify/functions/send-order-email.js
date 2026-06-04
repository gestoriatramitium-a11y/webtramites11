const Stripe = require('stripe');
const {
  SERVICES,
  jsonResponse,
  parseJson,
  cleanText,
  formDataToText,
  sendEmailJS
} = require('./_services');

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

  const paymentIntentId = cleanText(body.paymentIntentId, 120);
  const reference = cleanText(body.reference, 60);
  const clientEmail = cleanText(body.clientEmail, 180);
  const formDataText = formDataToText(body.formData);
  const authorization = body.attachments && body.attachments.autorizacion;
  const authorizationFile = authorization && typeof authorization.content === 'string' ? authorization.content : '';
  const authorizationFileName = authorization && typeof authorization.name === 'string' ? authorization.name : 'autorizacion';

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return jsonResponse(402, { error: 'El pago todavía no figura como completado en Stripe.' });
    }

    if (intent.amount_received < service.price * 100 || intent.currency !== 'eur') {
      return jsonResponse(402, { error: 'El importe recibido no coincide con el servicio solicitado.' });
    }

    await sendEmailJS({
      service_title: service.title,
      service_tag: service.tag,
      price: `${service.price}€`,
      reference,
      client_email: clientEmail || intent.receipt_email || 'No indicado',
      form_data: formDataText,
      payment_id: paymentIntentId,
      reply_to: clientEmail || intent.receipt_email || '',
      admin_email: process.env.ADMIN_EMAIL || 'gestoriatramitium@gmail.com',
      authorization_file: authorizationFile,
      authorization_filename: authorizationFileName
    });

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('send-order-email error:', error);
    return jsonResponse(500, { error: 'El pago fue correcto, pero no se pudo enviar el aviso por email.' });
  }
};
