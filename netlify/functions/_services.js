const SERVICES = {
  'prop-nota-simple': { tag: 'Registro de la Propiedad', title: 'Nota Simple Informativa', price: 25 },
  'prop-inscripcion': { tag: 'Registro de la Propiedad', title: 'Inscripci?n de Escritura', price: 150 },
  'prop-certificacion': { tag: 'Registro de la Propiedad', title: 'Certificaci?n Registral', price: 95 },
  'prop-cancelacion': { tag: 'Registro de la Propiedad', title: 'Cancelaci?n de Carga', price: 230 },
  'prop-localizacion': { tag: 'Registro de la Propiedad', title: 'Nota de Localizaci?n de Propiedades', price: 25 },
  'civil-nacimiento': { tag: 'Registro Civil', title: 'Certificado de Nacimiento', price: 35 },
  'civil-matrimonio': { tag: 'Registro Civil', title: 'Certificado de Matrimonio', price: 35 },
  'civil-defuncion': { tag: 'Registro Civil', title: 'Certificado de Defunci?n', price: 35 },
  'civil-fe-vida': { tag: 'Registro Civil', title: 'Fe de Vida y Estado', price: 60 },
  'civil-cambio-nombre': { tag: 'Registro Civil', title: 'Cambio de Nombre', price: 385 },
  'merc-denominacion': { tag: 'Registro Mercantil', title: 'Denominaci?n Social', price: 60 },
  'merc-deposito': { tag: 'Registro Mercantil', title: 'Dep?sito de Cuentas Anuales', price: 150 },
  'merc-certificacion': { tag: 'Registro Mercantil', title: 'Certificaci?n Registral Mercantil', price: 80 },
  'merc-inscripcion': { tag: 'Registro Mercantil', title: 'Inscripci?n de Escritura Mercantil', price: 205 },
  'merc-nota': { tag: 'Registro Mercantil', title: 'Nota Simple Mercantil', price: 25 },
  'informe-empresarial': { tag: 'Otros servicios', title: 'Informe Empresarial Integral', price: 15 },
  'trafico-informe-matricula': { tag: 'Tr?fico', title: 'Informe de Tr?fico de un Veh?culo por Matr?cula', price: 25 },
  'contrato-privado': { tag: 'Otros servicios', title: 'Elaboraci?n de Contrato Privado', price: 40 }
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

function parseJson(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (_) {
    return null;
  }
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function cleanText(value, max = 180) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, max);
}

function formDataToText(formData) {
  if (!formData || typeof formData !== 'object') return '';
  return Object.entries(formData)
    .map(([key, value]) => `${key}: ${String(value || '').trim()}`)
    .join('\n')
    .slice(0, 7000);
}

async function sendEmailJS(templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error('Faltan variables EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID o EMAILJS_PUBLIC_KEY.');
  }

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams
  };

  if (privateKey) body.accessToken = privateKey;

  const postEmail = async (payload) => {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await response.text().catch(() => '');
    return { ok: response.ok, status: response.status, text };
  };

  let result = await postEmail(body);

  if (!result.ok && privateKey && [400, 401, 403].includes(result.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const fallbackBody = { ...body };
    delete fallbackBody.accessToken;
    result = await postEmail(fallbackBody);
  }

  if (!result.ok) {
    throw new Error(`EmailJS ha devuelto ${result.status}: ${result.text}`);
  }

  return true;
}

module.exports = {
  SERVICES,
  jsonResponse,
  parseJson,
  isEmail,
  cleanText,
  formDataToText,
  sendEmailJS
};

