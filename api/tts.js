// api/tts.js - Text-to-Speech API for AI Agents
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
        const { text, agentType } = req.body;
        
        // Validate input
        if (!text || !agentType) {
            res.status(400).json({ 
                error: 'Missing required fields',
                required: ['text', 'agentType'],
                received: { text: !!text, agentType: !!agentType }
            });
            return;
        }

        if (text.length > 500) {
            res.status(400).json({ error: 'Text too long. Maximum 500 characters.' });
            return;
        }

        // Get API key
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
        if (!ELEVENLABS_API_KEY) {
            console.error('ElevenLabs API key not configured');
            res.status(500).json({ 
                error: 'TTS service not configured',
                fallback: true 
            });
            return;
        }

        // Voice mapping with your specific IDs
        const voiceIds = {
            juan: 'tL5DHtPRo8KiW5xsx8yD',
            marcela: 'VmejBeYhbrcTPwDniox7', 
            carlos: 'Ux2YbCNfurnKHnzlBHGX',
            valentina: 'TsKSGPuG26FpNj0JzQBq',
            mariana: 'xwH1gVhr2dWKPJkpNQT9',
            andrea: 'oWSxI36XAKnfMWmzmQok',
            andres: 'wmXH34EF7LAsKTjOZWWt',
            sofia: 'UNIruiz09F4kWYjRpOvy',
            carolina: '86V9x9hrQds83qf7zaGn',
            luis: 'ucWwAruuGtBeHfnAaKcJ'
        };

        const voiceId = voiceIds[agentType];
        if (!voiceId) {
            res.status(400).json({ 
                error: `Unknown agent type: ${agentType}`,
                available: Object.keys(voiceIds)
            });
            return;
        }

        // Optimize text for Spanish pronunciation
        const optimizedText = optimizeTextForSpeech(text);

        // Voice settings per agent
        const voiceSettings = getVoiceSettings(agentType);

        console.log(`Generating TTS for ${agentType} with voice ${voiceId}`);

        // Call ElevenLabs API
        const elevenlabsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: optimizedText,
                model_id: "eleven_multilingual_v2",
                voice_settings: voiceSettings
            })
        });

        if (!elevenlabsResponse.ok) {
            const errorText = await elevenlabsResponse.text();
            console.error('ElevenLabs API Error:', {
                status: elevenlabsResponse.status,
                statusText: elevenlabsResponse.statusText,
                body: errorText,
                voiceId: voiceId,
                agentType: agentType
            });

            res.status(500).json({
                error: 'TTS generation failed',
                details: `ElevenLabs API returned ${elevenlabsResponse.status}`,
                fallback: true
            });
            return;
        }

        // Get audio data
        const audioBuffer = await elevenlabsResponse.arrayBuffer();
        
        if (audioBuffer.byteLength === 0) {
            res.status(500).json({
                error: 'Empty audio response',
                fallback: true
            });
            return;
        }

        // Convert to base64
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');
        
        console.log(`TTS generated successfully for ${agentType}: ${audioBuffer.byteLength} bytes`);

        // Send response
        res.status(200).json({
            success: true,
            audio: audioBase64,
            contentType: 'audio/mpeg',
            size: audioBuffer.byteLength,
            agentType: agentType,
            voiceId: voiceId
        });

    } catch (error) {
        console.error('TTS Handler Error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            fallback: true
        });
    }
}

function optimizeTextForSpeech(text) {
    let optimized = text;
    
    // Replace numbers with Spanish words for better pronunciation
    optimized = optimized.replace(/\$(\d{1,3}(?:,\d{3})*)/g, (match, number) => {
        const num = parseInt(number.replace(/,/g, ''));
        return numberToSpanishWords(num) + ' pesos';
    });
    
    // Handle percentages
    optimized = optimized.replace(/(\d+)%/gi, (match, number) => {
        return numberToSpanishWords(parseInt(number)) + ' por ciento';
    });
    
    // Handle dates
    optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})/g, (match, day, month) => {
        return numberToSpanishWords(parseInt(day)) + ' del ' + numberToSpanishWords(parseInt(month));
    });

    // Technical specifications
    optimized = optimized.replace(/(\d+)\s*GB/gi, (match, number) => {
        return numberToSpanishWords(parseInt(number)) + ' gigabytes';
    });

    optimized = optimized.replace(/(\d+)\s*MB/gi, (match, number) => {
        return numberToSpanishWords(parseInt(number)) + ' megabytes';
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
    
    // Handle thousands
    if (number < 1000000) {
        const thousands = Math.floor(number / 1000);
        const remainder = number % 1000;
        let result = '';
        
        if (thousands === 1) {
            result = 'mil';
        } else if (thousands < 100) {
            result = numberToSpanishWords(thousands) + ' mil';
        } else {
            result = numberToSpanishWords(thousands) + ' mil';
        }
        
        if (remainder > 0) {
            result += ' ' + numberToSpanishWords(remainder);
        }
        
        return result;
    }
    
    // Handle millions
    if (number < 1000000000) {
        const millions = Math.floor(number / 1000000);
        const remainder = number % 1000000;
        let result = '';
        
        if (millions === 1) {
            result = 'un millón';
        } else {
            result = numberToSpanishWords(millions) + ' millones';
        }
        
        if (remainder > 0) {
            result += ' ' + numberToSpanishWords(remainder);
        }
        
        return result;
    }
    
    return number.toString();
}

function getVoiceSettings(agentType) {
    const settings = {
        sofia: { stability: 0.75, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
        carolina: { stability: 0.8, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true },
        luis: { stability: 0.7, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
        mariana: { stability: 0.8, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
        juan: { stability: 0.85, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
        carlos: { stability: 0.75, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
        marcela: { stability: 0.8, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true },
        andrea: { stability: 0.75, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
        andres: { stability: 0.7, similarity_boost: 0.75, style: 0.4, use_speaker_boost: true },
        valentina: { stability: 0.75, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true }
    };
    
    return settings[agentType] || settings.sofia;
}