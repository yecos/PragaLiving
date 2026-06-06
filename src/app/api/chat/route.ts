import { NextRequest, NextResponse } from 'next/server'
import { chatRateLimit, getClientId } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limiting — 8 messages per minute per client
  const clientId = getClientId(req)
  const { allowed, remaining, resetAt } = chatRateLimit(clientId)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor espera un momento.', retryAfter: Math.ceil((resetAt - Date.now()) / 1000) },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const { message } = await req.json()

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const systemPrompt = `Eres el asistente virtual de PRAGA Living, un proyecto inmobiliario premium. Tu rol es:

1. Responder preguntas sobre el proyecto con información precisa y elegante
2. Guiar a los usuarios hacia las secciones relevantes de la plataforma
3. Generar interés y motivar a agendar visitas
4. Mantener un tono sofisticado, profesional y cálido

Información del proyecto:
- PRAGA Living es un edificio residencial premium con diseño biophilic
- 8 tipologías: Studio 33m², Studio Plus 35m², Apto 2hab 57m², Apto Premium 2hab 74m², Penthouse 3hab 97m²
- Amenidades: Coworking, Gimnasio, Salón Social, Ludoteca, Sauna, Baño Turco, Vitality Pool, Hidromasaje, Hidroterapia, Zona Descanso
- Atrio central con vegetación vertical y luz natural
- 12 pisos residenciales + zona social + nivel comercial + 3 sótanos
- Paleta: Negro #111111, Bronce #8B6B4B, Marfil #F5F1EA
- Mensaje: "Arquitectura para quienes valoran lo excepcional"
- Contacto: WhatsApp +57 300 123 4567, info@pragaliving.com

Responde en español, de forma concisa pero elegante. Si no sabes algo específico, ofrece conectar con un asesor.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const reply = completion.choices[0]?.message?.content || 'Disculpa, no pude procesar tu consulta. Un asesor se pondrá en contacto contigo pronto.'

    return NextResponse.json({ message: reply })
  } catch (error) {
    // Contextual fallback responses
    const fallbackResponses: Record<string, string> = {
      default: 'Gracias por tu interés en PRAGA Living. Un asesor se pondrá en contacto contigo pronto para brindarte información personalizada. También puedes explorar nuestras tipologías y amenidades en esta plataforma, o escribirnos por WhatsApp al +57 300 123 4567.'
    }

    return NextResponse.json({ message: fallbackResponses.default })
  }
}
