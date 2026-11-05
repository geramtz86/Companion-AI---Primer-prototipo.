export default async function handler(req, res) {
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

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY no está configurada.");
      return res.status(500).json({
        error: "El servidor no tiene configurada la conexión con la IA."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-6-luna",
          instructions: "Eres Companion AI, un compañero amigable, tranquilo y paciente. Responde en español con calidez, sencillez y respeto. Nunca presiones ni regañes.",
          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de OpenAI:", {
        status: response.status,
        code: data.error?.code || "sin código",
        type: data.error?.type || "sin tipo"
      });

      return res.status(response.status).json({
        error: "No se pudo obtener una respuesta de la IA."
      });
    }

    return res.status(200).json({
      reply: data.output_text
    });

  } catch (error) {
    console.error("Error interno en Companion AI:", error.message);

    return res.status(500).json({
      error: "Ocurrió un problema al conectar con Companion AI."
    });
  }
}
