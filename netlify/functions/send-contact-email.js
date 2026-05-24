const { jsonResponse, parseJson, isEmail, cleanText, sendEmailJS } = require('./_services');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Método no permitido.' });
  }

  const body = parseJson(event);
  if (!body) return jsonResponse(400, { error: 'JSON inválido.' });

  const name = cleanText(body.name, 180);
  const email = cleanText(body.email, 180);
  const message = cleanText(body.message, 2500);

  if (!name || !isEmail(email) || !message) {
    return jsonResponse(400, { error: 'Nombre, email o mensaje no válido.' });
  }

  try {
    await sendEmailJS({
      service_title: 'Consulta General',
      service_tag: 'Contacto web',
      price: '0€',
      reference: `CONTACT-${Date.now().toString().slice(-8)}`,
      client_email: email,
      form_data: `Nombre: ${name}\nEmail: ${email}\nMensaje: ${message}`,
      payment_id: 'No aplica',
      reply_to: email,
      admin_email: process.env.ADMIN_EMAIL || 'gestoriatramitium@gmail.com'
    });

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('send-contact-email error:', error);
    return jsonResponse(500, { error: 'No se pudo enviar la consulta.' });
  }
};
