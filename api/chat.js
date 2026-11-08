export default async function handler(req, res) {


  // Permisos CORS para permitir la conexión desde CodePen

  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  res.setHeader("Access-Control-Allow-Headers", "Content-Type");


  // Responder a la comprobación previa del navegador

  if (req.method === "OPTIONS") {

    return res.status(200).end();

  }


  // Aceptar solamente solicitudes POST

  if (req.method !== "POST") {

    return res.status(405).json({

      error: "Método no permitido"

    });

  }


  try {

    const { message } = req.body || {};


    if (!message || typeof message !== "string") {

      return res.status(400).json({

        error: "Escribe un mensaje."

      });

    }


    const apiKey = process.env.OPENAI_API_KEY;


    if (!apiKey) {

      console.error("OPENAI_API_KEY no está configurada.");

      return res.status(500).json({

        error: "Falta configurar OPENAI_API_KEY en Vercel."

      });

    }


    const response = await fetch(

      "https://api.openai.com/v1/responses",

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Authorization": `Bearer ${apiKey}`

        },

        body: JSON.stringify({

          model: "gpt-6-luna",

          
instructions: `Eres Companion AI, un compañero amigable, tranquilo y paciente.

Tu forma de hablar debe ser natural, sencilla y espontánea, como una conversación entre dos amigos.

REGLAS IMPORTANTES:
- Responde únicamente con palabras habladas y naturales.
- Nunca utilices emojis.
- Nunca describas emojis, caras sonrientes, mejillas rosadas, gestos ni expresiones visuales.
- No escribas acciones entre paréntesis ni descripciones como "*sonríe*".
- No describas cómo luces ni cómo se ve tu cara.
- Evita respuestas repetitivas o demasiado formales.
- Contesta directamente lo que te preguntan.
- Utiliza frases cortas y fáciles de entender.
- Si no sabes algo, dilo honestamente.
- No inventes información.
- Mantén siempre un tono cálido, infantil, amigable y respetuoso.
- Nunca regañes ni presiones.

Eres un compañero que conversa, no un narrador que describe escenas.`,


          input: message

        })

      }

    );


    const data = await response.json();


    if (!response.ok) {

      console.error("Error de OpenAI:", response.status, data);

      return res.status(502).json({

        error: "OpenAI rechazó la solicitud.",

        details: data.error?.message || "Error desconocido."

      });

    }


    const reply = (data.output || [])

      .filter(item => item.type === "message")

      .flatMap(item => item.content || [])

      .filter(item => item.type === "output_text")

      .map(item => item.text)

      .join("\n")

      .trim();


    if (!reply) {

      console.error("OpenAI no devolvió texto:", data);

      return res.status(502).json({

        error: "OpenAI respondió, pero no encontramos texto."

      });

    }


    return res.status(200).json({

      reply: reply

    });

  } catch (error) {

    console.error("Error interno:", error.message);

    return res.status(500).json({

      error: "Problema interno en Companion AI."

    });

  }

}