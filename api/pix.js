export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { amount, description, reference, customerNome, customerPhone } = req.body;

    const apiKey = process.env.PARADISE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave de API não configurada no servidor.' });
    }

    const payload = {
      amount: parseInt(amount, 10),
      description: description,
      reference: reference,
      customer: {
        name: customerNome || "Cliente Fogão Brazuca",
        email: "cliente@fogaobrazuca.com",
        phone: customerPhone ? customerPhone.replace(/\D/g, '') : "11999999999",
        document: "00000000000"
      },
      source: "api_externa"
    };

    const response = await fetch('https://multi.paradisepags.com/api/v1/transaction.php', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status === 'success') {
      return res.status(200).json(data);
    } else {
      return res.status(400).json(data);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
