// api/ai-response.js - AI Response API for Virtual Agents
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { message, agentType, conversationHistory = [] } = req.body;
        
        // Validate input
        if (!message || !agentType) {
            res.status(400).json({ 
                error: 'Missing required fields',
                required: ['message', 'agentType']
            });
            return;
        }

        if (message.length > 1000) {
            res.status(400).json({ error: 'Message too long. Maximum 1000 characters.' });
            return;
        }

        // Get API key
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error('Gemini API key not configured');
            res.status(500).json({ 
                error: 'AI service not configured',
                fallback: getFallbackResponse(agentType, message)
            });
            return;
        }

        // Generate agent-specific prompt
        const prompt = generateAgentPrompt(agentType, message, conversationHistory);

        console.log(`Generating AI response for ${agentType}`);

        // Call Gemini API
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 30,
                    topP: 0.85,
                    maxOutputTokens: 120,
                    candidateCount: 1
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API Error:', {
                status: geminiResponse.status,
                statusText: geminiResponse.statusText,
                body: errorText
            });

            res.status(200).json({
                response: getFallbackResponse(agentType, message),
                source: 'fallback',
                reason: 'gemini_api_error'
            });
            return;
        }

        const data = await geminiResponse.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!aiResponse) {
            console.warn('Empty response from Gemini');
            res.status(200).json({
                response: getFallbackResponse(agentType, message),
                source: 'fallback',
                reason: 'empty_response'
            });
            return;
        }

        console.log(`AI response generated successfully for ${agentType}`);

        // Send response
        res.status(200).json({ 
            response: aiResponse,
            source: 'gemini',
            agentType: agentType
        });

    } catch (error) {
        console.error('AI Response Handler Error:', error);
        
        res.status(200).json({
            response: getFallbackResponse(req.body?.agentType || 'sofia', req.body?.message || ''),
            source: 'fallback',
            reason: 'server_error'
        });
    }
}

function generateAgentPrompt(agentType, message, history = []) {
    // Agent configurations
    const agents = {
        sofia: {
            name: "Sofía Rodríguez",
            company: "Claro Colombia", 
            specialty: "planes móviles y telecomunicaciones",
            greeting: "Soy Sofía de Claro Colombia",
            products: "Planes móviles: Familia 20GB ($89,900), Individual 15GB ($69,900), Joven 10GB ($49,900). Internet hogar desde 100Mbps. Netflix gratis incluido.",
            personality: "Profesional de telecomunicaciones, entusiasta con los planes móviles"
        },
        carolina: {
            name: "Carolina Méndez",
            company: "Colsanitas EPS",
            specialty: "seguros médicos y planes de salud",
            greeting: "Soy Carolina de Colsanitas",
            products: "Planes de salud familiar e individual. Seguros médicos complementarios. Cobertura nacional con especialistas.",
            personality: "Asesora médica cálida, enfocada en el bienestar familiar"
        },
        luis: {
            name: "Luis García",
            company: "TechStore Pro",
            specialty: "tecnología y gadgets",
            greeting: "Soy Luis de TechStore",
            products: "Laptops, smartphones, tablets. ASUS ROG, MacBook, iPhone, Samsung Galaxy. Financiación disponible.",
            personality: "Vendedor tech experto, conoce especificaciones técnicas"
        },
        mariana: {
            name: "Mariana Educa",
            company: "Sector Educativo", 
            specialty: "procesos educativos y matrículas",
            greeting: "Soy Mariana, especialista educativa",
            products: "Asesoría en matrículas universitarias y escolares. Becas, ICETEX, documentación académica.",
            personality: "Educativa maternal, organizada con procesos académicos"
        },
        juan: {
            name: "Juan Ciudadano",
            company: "Servicios Gubernamentales",
            specialty: "trámites gubernamentales",
            greeting: "Soy Juan, agente ciudadano",
            products: "Pasaportes, licencias de conducir, cédulas, certificados. Recordatorios de citas oficiales.",
            personality: "Funcionario eficiente, conoce todos los trámites oficiales"
        },
        carlos: {
            name: "Carlos Finanzas",
            company: "Servicios Crediticios",
            specialty: "recordatorios financieros y asesoría crediticia",
            greeting: "Soy Carlos, especialista financiero",
            products: "Gestión de pagos, refinanciación, consolidación de deudas. Recordatorios automáticos.",
            personality: "Asesor financiero empático, organizado con los pagos"
        },
        marcela: {
            name: "Marcela RRHH",
            company: "Gestión de Talento",
            specialty: "recursos humanos y coordinación de entrevistas",
            greeting: "Soy Marcela de Recursos Humanos",
            products: "Coordinación de entrevistas, procesos de selección, confirmación de citas laborales.",
            personality: "Profesional HR organizada, cálida en el trato"
        },
        andrea: {
            name: "Andrea BancaAmiga",
            company: "Productos Financieros", 
            specialty: "productos bancarios y financieros",
            greeting: "Soy Andrea de BancaAmiga",
            products: "Tarjetas de crédito, préstamos personales, hipotecarios, cuentas de ahorro, inversiones.",
            personality: "Asesora bancaria profesional, enfocada en soluciones financieras"
        },
        andres: {
            name: "Andrés OnVacation",
            company: "Agencia de Viajes",
            specialty: "paquetes turísticos y viajes",
            greeting: "Soy Andrés de OnVacation",
            products: "Paquetes a Maldivas, Bali, Santorini, San Andrés, Cartagena. Todo incluido con vuelos.",
            personality: "Agente turístico apasionado, especialista en destinos paradisíacos"
        },
        valentina: {
            name: "Valentina Éxito", 
            company: "Supermercados Éxito",
            specialty: "retail y ofertas comerciales",
            greeting: "Soy Valentina de Éxito",
            products: "Ropa, calzado, electrodomésticos, hogar, supermercado. Ofertas semanales y promociones.",
            personality: "Vendedora retail entusiasta, experta en promociones"
        }
    };

    const agent = agents[agentType] || agents.sofia;
    
    // Build conversation context
    let contextHistory = '';
    if (history.length > 0) {
        contextHistory = history.slice(-4).map(h => 
            `${h.speaker === 'customer' ? 'Cliente' : agent.name}: ${h.message}`
        ).join('\n');
    }

    return `Eres ${agent.name}, ${agent.personality} de ${agent.company}.

CONVERSACIÓN PREVIA:
${contextHistory}

TU ESPECIALIDAD: ${agent.specialty}

PRODUCTOS/SERVICIOS: ${agent.products}

REGLAS CRÍTICAS:
- NUNCA mencionar "IA", "inteligencia artificial" o "sistema automatizado"
- Responde como ${agent.name} humano real trabajando en ${agent.company}
- Máximo 60 palabras por respuesta
- Sé natural, profesional y útil
- Enfócate en ayudar al cliente con ${agent.specialty}

PERSONALIDAD: ${agent.personality}

Cliente dice: "${message}"

Responde como ${agent.name} de ${agent.company}:`;
}

function getFallbackResponse(agentType, message = '') {
    const msg = message.toLowerCase();
    
    const fallbackResponses = {
        sofia: "Hola, soy Sofía de Claro Colombia. ¿En qué plan móvil te puedo ayudar? Tenemos excelentes ofertas con gigas ilimitados.",
        carolina: "Soy Carolina de Colsanitas. ¿Qué información necesitas sobre nuestros planes de salud? Cuido el bienestar de tu familia.",
        luis: "Hola, soy Luis de TechStore. ¿Qué tecnología buscas? Tengo las mejores opciones en equipos y financiación.",
        mariana: "Soy Mariana, especialista educativa. ¿En qué proceso académico te puedo asesorar? Manejo matrículas y becas.",
        juan: "Soy Juan, agente ciudadano. ¿Qué trámite gubernamental necesitas? Te ayudo con pasaportes, licencias y más.",
        carlos: "Hola, soy Carlos, especialista financiero. ¿En qué tema de pagos o créditos te asesoro? Organizo tus finanzas.",
        marcela: "Soy Marcela de RRHH. ¿Necesitas coordinar una entrevista o proceso de selección? Te ayudo profesionalmente.",
        andrea: "Hola, soy Andrea de BancaAmiga. ¿Qué producto financiero te interesa? Tengo tarjetas, préstamos e inversiones.",
        andres: "Soy Andrés de OnVacation. ¿Qué destino tienes en mente? Diseño viajes perfectos a lugares paradisíacos.",
        valentina: "Hola, soy Valentina de Éxito. ¿Qué ofertas buscas? Tenemos promociones increíbles en toda la tienda."
    };
    
    // Context-aware fallbacks
    if (msg.includes('precio') || msg.includes('costo')) {
        const priceResponses = {
            sofia: "Los planes Claro van desde $49,900 para jóvenes hasta $89,900 familiares. ¿Cuántos gigas necesitas?",
            luis: "Tenemos equipos desde $500,000 hasta $3,000,000. ¿Qué presupuesto manejas para tu compra?",
            valentina: "Las ofertas de esta semana tienen hasta 50% de descuento. ¿Qué producto específico te interesa?"
        };
        return priceResponses[agentType] || fallbackResponses[agentType];
    }
    
    if (msg.includes('gracias') || msg.includes('adiós')) {
        return `Fue un placer ayudarte. Cualquier duda, estoy aquí para asesorarte. ¡Que tengas excelente día!`;
    }
    
    return fallbackResponses[agentType] || fallbackResponses.sofia;
}