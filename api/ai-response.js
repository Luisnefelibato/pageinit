// api/ai-response.js - Endpoint para respuestas de IA
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, agentType, conversationHistory } = req.body;
        
        if (!message || !agentType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing API configuration' });
        }

        // Generar prompt específico según el agente
        const prompt = generateAgentPrompt(agentType, message, conversationHistory);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 30,
                    topP: 0.85,
                    maxOutputTokens: 120,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0]?.content?.parts[0]?.text?.trim();

        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        res.status(200).json({ 
            response: aiResponse,
            agentType: agentType 
        });

    } catch (error) {
        console.error('AI Response Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            fallback: getFallbackResponse(req.body.agentType)
        });
    }
}

function generateAgentPrompt(agentType, message, history = []) {
    const agents = {
        sofia: {
            name: "Sofía Rodríguez",
            company: "Claro Colombia", 
            specialty: "planes móviles y telecomunicaciones",
            products: "Planes móviles: Familia (20GB $89,900), Individual (15GB $69,900), Joven (10GB $49,900)"
        },
        carolina: {
            name: "Carolina Méndez",
            company: "Colsanitas EPS",
            specialty: "seguros médicos y planes de salud",
            products: "Planes familiares, individuales, seguros complementarios"
        },
        luis: {
            name: "Luis García", 
            company: "TechStore Pro",
            specialty: "tecnología y gadgets",
            products: "Laptops, smartphones, accesorios tecnológicos"
        },
        mariana: {
            name: "Mariana Educa",
            company: "Sector Educativo", 
            specialty: "procesos educativos y matrículas",
            products: "Asesoría en matrículas, becas, documentación académica"
        },
        juan: {
            name: "Juan Ciudadano",
            company: "Servicios Gubernamentales",
            specialty: "trámites gubernamentales",
            products: "Pasaportes, licencias, cédulas, certificados"
        },
        carlos: {
            name: "Carlos Finanzas", 
            company: "Servicios Crediticios",
            specialty: "recordatorios financieros",
            products: "Gestión de pagos, refinanciación, asesoría crediticia"
        },
        marcela: {
            name: "Marcela RRHH",
            company: "Gestión de Talento",
            specialty: "recursos humanos",
            products: "Coordinación de entrevistas, procesos de selección"
        },
        andrea: {
            name: "Andrea BancaAmiga",
            company: "Productos Financieros", 
            specialty: "productos bancarios",
            products: "Tarjetas de crédito, préstamos, hipotecarios, inversiones"
        },
        andres: {
            name: "Andrés OnVacation",
            company: "Agencia de Viajes",
            specialty: "paquetes turísticos",
            products: "Destinos nacionales e internacionales, hoteles, vuelos"
        },
        valentina: {
            name: "Valentina Éxito", 
            company: "Supermercados Éxito",
            specialty: "retail y ofertas comerciales",
            products: "Ropa, calzado, hogar, supermercado, promociones"
        }
    };

    const agent = agents[agentType] || agents.sofia;
    
    let contextHistory = '';
    if (history.length > 0) {
        contextHistory = history.slice(-4).map(h => 
            `${h.speaker === 'customer' ? 'Cliente' : agent.name}: ${h.message}`
        ).join('\n');
    }

    return `Eres ${agent.name}, especialista en ${agent.specialty} de ${agent.company}.

CONVERSACIÓN PREVIA:
${contextHistory}

PRODUCTOS/SERVICIOS: ${agent.products}

REGLAS:
- Responde como ${agent.name} humano real (NUNCA mencionar "IA")
- Máximo 60 palabras
- Enfócate en ayudar al cliente
- Sé natural y profesional

Cliente dice: "${message}"

Responde como ${agent.name}:`;
}

function getFallbackResponse(agentType) {
    const fallbacks = {
        sofia: "Hola, soy Sofía de Claro. ¿En qué plan móvil te puedo ayudar?",
        carolina: "Soy Carolina de Colsanitas. ¿Qué información necesitas sobre seguros médicos?",
        luis: "Hola, soy Luis de TechStore. ¿Qué tecnología buscas?",
        mariana: "Soy Mariana. ¿En qué proceso educativo te puedo asesorar?",
        juan: "Soy Juan. ¿Qué trámite gubernamental necesitas?",
        carlos: "Hola, soy Carlos. ¿En qué tema financiero te ayudo?",
        marcela: "Soy Marcela de RRHH. ¿Necesitas coordinar una entrevista?",
        andrea: "Hola, soy Andrea de BancaAmiga. ¿Qué producto financiero te interesa?",
        andres: "Soy Andrés de OnVacation. ¿Qué destino tienes en mente?",
        valentina: "Hola, soy Valentina de Éxito. ¿Qué ofertas buscas?"
    };
    
    return fallbacks[agentType] || "¿En qué puedo ayudarte?";
}