// api/tts.js - Endpoint para síntesis de voz con ElevenLabs
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
        const { text, agentType } = req.body;
        
        if (!text || !agentType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        if (!ELEVENLABS_API_KEY) {
            return res.status(500).json({ error: 'Missing ElevenLabs configuration' });
        }

        // Mapeo de agentes a voice IDs
        const voiceIds = {
            sofia: 'EXAVITQu4vr4xnSDxMaL',        // Voz femenina profesional
            carolina: '86V9x9hrQds83qf7zaGn',      // Voz femenina cálida
            luis: 'ucWwAruuGtBeHfnAaKcJ',         // Voz masculina tech
            mariana: 'xwH1gVhr2dWKPJkpNQT9',     // Voz femenina educativa
            juan: 'tL5DHtPRo8KiW5xsx8yD',        // Voz masculina oficial
            carlos: 'Ux2YbCNfurnKHnzlBHGX',      // Voz masculina financiera
            marcela: 'VmejBeYhbrcTPwDniox7',      // Voz femenina RRHH
            andrea: 'oWSxI36XAKnfMWmzmQok',      // Voz femenina bancaria
            andres: 'wmXH34EF7LAsKTjOZWWt',      // Voz masculina turismo
            valentina: 'TsKSGPuG26FpNj0JzQBq'   // Voz femenina retail
        };

        const voiceId = voiceIds[agentType] || voiceIds.sofia;
        
        // Optimizar texto para síntesis de voz
        const optimizedText = optimizeTextForSpeech(text);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: optimizedText,
                model_id: "eleven_turbo_v2_5",
                voice_settings: getVoiceSettings(agentType)
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBuffer = await response.arrayBuffer();
        
        // Enviar audio como base64
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        
        res.status(200).json({ 
            audio: audioBase64,
            contentType: 'audio/mpeg'
        });

    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate speech',
            fallback: true 
        });
    }
}

function optimizeTextForSpeech(text) {
    let optimized = text;
    
    // Optimizar números para pronunciación en español
    optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
        const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
        if (cleanNumber >= 1000) {
            return numberToSpanishWords(cleanNumber) + (cleanNumber > 10000 ? ' pesos' : '');
        }
        return numberToSpanishWords(cleanNumber);
    });
    
    // Optimizar porcentajes
    optimized = optimized.replace(/(\d+)%/gi, (match, number) => {
        return numberToSpanishWords(parseInt(number)) + ' por ciento';
    });
    
    // Optimizar fechas
    optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})/g, (match, day, month) => {
        return numberToSpanishWords(parseInt(day)) + ' del ' + numberToSpanishWords(parseInt(month));
    });
    
    return optimized;
}

function numberToSpanishWords(number) {
    if (number === 0) return 'cero';
    if (number === 100) return 'cien';
    
    const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    
    if (number < 10) return ones[number];
    if (number < 20) return teens[number - 10];
    if (number < 30) return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
    if (number < 100) return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
    
    if (number < 1000000) {
        const thousands = Math.floor(number / 1000);
        const remainder = number % 1000;
        const thousandsText = thousands === 1 ? 'mil' : numberToSpanishWords(thousands) + ' mil';
        return thousandsText + (remainder > 0 ? ' ' + numberToSpanishWords(remainder) : '');
    }
    
    return number.toString();
}

function getVoiceSettings(agentType) {
    const settings = {
        sofia: { stability: 0.8, similarity_boost: 0.8, style: 0.2 },
        carolina: { stability: 0.75, similarity_boost: 0.85, style: 0.6 },
        luis: { stability: 0.65, similarity_boost: 0.75, style: 0.4 },
        mariana: { stability: 0.71, similarity_boost: 0.8, style: 0.3 },
        juan: { stability: 0.7, similarity_boost: 0.8, style: 0.3 },
        carlos: { stability: 0.75, similarity_boost: 0.8, style: 0.3 },
        marcela: { stability: 0.70, similarity_boost: 0.80, style: 0.3 },
        andrea: { stability: 0.7, similarity_boost: 0.8, style: 0.3 },
        andres: { stability: 0.65, similarity_boost: 0.75, style: 0.4 },
        valentina: { stability: 0.7, similarity_boost: 0.8, style: 0.3 }
    };
    
    return settings[agentType] || settings.sofia;
}