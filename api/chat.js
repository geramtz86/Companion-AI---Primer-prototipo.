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
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {

      return res.status(400).json({

        error: "Escribe un mensaje."

      });

    }

    // --- MEMORIA: lo nuevo ---
    // El front ya manda history con lo que se habló antes.
    // Si viene, lo usamos como input. Si no viene, seguimos
    // como antes, solo con el mensaje de ahorita.
    // Ojo: el front ya incluyó el mensaje actual en history,
    // así que NO lo agregamos otra vez aquí.
    let input = message;

    if (Array.isArray(history) && history.length > 0) {
      const historialLimpio = history
        .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      if (historialLimpio.length > 0) {
        input = historialLimpio;
      }
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

          instructions: "Eres Companion AI, un compañero amigable, tranquilo y paciente. Responde en español con calidez, sencillez y respeto. Nunca presiones ni regañes.",

          input: input

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
