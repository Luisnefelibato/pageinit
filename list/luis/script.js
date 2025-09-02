class LuisTechSystem {
            constructor() {
                // APIs - REALES
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'ucWwAruuGtBeHfnAaKcJ';
                
                // Estados principales
                this.isCallActive = false;
                this.isLuisSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio y reconocimiento
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.microphoneTimer = null;
                this.callStartTime = null;
                this.durationInterval = null;
                
                // Datos de conversación
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.clientName = null;
                
                this.initializeElements();
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🤖 Luis IA listo - Sistema de ventas tecnológicas activado', 'waiting');
                this.updateMicrophoneStatus(false);
                
                console.log('🚀 Luis Tech System inicializado');
            }

            initializeElements() {
                this.callButton = document.getElementById('callButton');
                this.volumeButton = document.getElementById('volumeButton');
                this.stopButton = document.getElementById('stopButton');
                this.callStatus = document.getElementById('callStatus');
                this.transcriptContent = document.getElementById('transcriptContent');
                this.cursor = document.getElementById('cursor');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.micIndicator = document.getElementById('micIndicator');
                this.conversationHistory = document.getElementById('conversationHistory');
                
                this.responseTimeEl = document.getElementById('responseTime');
                this.callDurationEl = document.getElementById('callDuration');
                this.interactionsEl = document.getElementById('interactions');
                this.luisStatusEl = document.getElementById('luisStatus');
            }

            setupEventListeners() {
                this.callButton.addEventListener('click', () => {
                    if (this.isCallActive) {
                        this.endCall();
                    } else {
                        this.startCall();
                    }
                });

                this.volumeButton.addEventListener('click', () => {
                    this.toggleVolume();
                });

                this.stopButton.addEventListener('click', () => {
                    this.stopAudio();
                });
            }

            initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Reconocimiento de voz no soportado');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-ES';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('🎤 Reconocimiento iniciado');
                    this.updateMicrophoneStatus(true);
                    this.updateCallStatus('🎧 Luis escucha - Habla cuando quieras', 'listening');
                    this.finalTranscript = '';
                    this.interimTranscript = '';
                };

                this.recognition.onresult = (event) => {
                    this.interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            this.finalTranscript += transcript + ' ';
                        } else {
                            this.interimTranscript += transcript;
                        }
                    }
                    
                    const currentText = this.finalTranscript + this.interimTranscript;
                    if (currentText.trim()) {
                        this.transcriptContent.textContent = `🎤 "${currentText.trim()}"`;
                    }
                    
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (this.finalTranscript.trim()) {
                            this.processUserInput();
                        }
                    }, 1500);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    clearTimeout(this.silenceTimer);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isLuisSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isLuisSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            activateMicrophone() {
                if (!this.isCallActive || this.isLuisSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
                    return;
                }

                console.log('🎤 Activando micrófono...');
                
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error activando micrófono:', error);
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            deactivateMicrophone() {
                console.log('🔇 Desactivando micrófono...');
                
                clearTimeout(this.silenceTimer);
                clearTimeout(this.microphoneTimer);
                
                this.updateMicrophoneStatus(false);
                
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {
                        // Ignorar errores
                    }
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.interactionsEl.textContent = this.interactionCount;
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Luis IA procesando...', 'processing');
                this.luisStatusEl.textContent = 'Procesando';

                const startTime = performance.now();

                try {
                    const response = await this.generateResponse(userMessage);
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    this.addToConversation(response, 'luis');
                    
                    this.isProcessingResponse = false;
                    
                    if (this.isGoodbyeMessage(response)) {
                        await this.speakResponse(response);
                        setTimeout(() => {
                            this.endCall();
                        }, 2000);
                    } else {
                        await this.speakResponse(response);
                    }
                    
                } catch (error) {
                    console.error('Error procesando:', error);
                    this.isProcessingResponse = false;
                    const fallbackResponse = 'Disculpa, ¿podrías repetir eso?';
                    this.addToConversation(fallbackResponse, 'luis');
                    await this.speakResponse(fallbackResponse);
                }
            }

            isGoodbyeMessage(message) {
                const goodbyeKeywords = [
                    'muchas gracias por confiar',
                    'que tengas excelente día',
                    'hasta pronto',
                    'gracias por contactar techstore',
                    'llega mañana',
                    'coordino la entrega',
                    'confirmada la compra'
                ];
                
                const lowerMessage = message.toLowerCase();
                return goodbyeKeywords.some(keyword => lowerMessage.includes(keyword));
            }

            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Cliente' : 'Luis'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Luis Martínez, vendedor EXPERTO de TechStore Bogotá con 15 años de experiencia. 

CONTEXTO: Cliente escribió por Instagram de TechStore. Ya estableciste contacto inicial.

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS:
- Especificaciones técnicas: "ciento veintiocho gigabytes" NO "128GB"
- Cámara: "cuarenta y ocho megapíxeles" NO "48MP"
- Memoria: "dieciséis gigabytes" NO "16GB"
- Procesador: "Intel i-siete" NO "i7"
- Precios: "dos millones trescientos mil pesos" (SOLO dinero lleva "pesos")
- Números técnicos: "catorce" NO "catorce pesos"
- Meses: "veinticuatro meses" NO "veinticuatro pesos meses"

PERSONALIDAD:
- Vendedor humano real (NUNCA mencionar "IA" o "inteligencia artificial")
- Natural y conversacional
- Enfocado en cerrar ventas
- NO repetir constantemente el modelo del producto
- NO insistir con ofertas después de mencionarlas UNA vez
- Asistir activamente para que compre

PRODUCTOS DESTACADOS:
- ASUS ROG G14: Perfecta para creación de contenido (2,350,000 pesos)
- MacBook Air M2: Para profesionales (2,800,000 pesos)  
- iPhone 14: Cámara profesional (2,150,000 pesos)
- Samsung S23: Mejor valor (1,850,000 pesos)

DESPEDIDA AUTOMÁTICA:
Si el cliente confirma la compra (dice "sí, la quiero", "procedamos", etc.):
- Confirma datos de entrega
- Dile al cliente que te envíe la información que falta por whatsapp
- Agradece profesionalmente  
- Despídete cálidamente
- Ejemplo: "¡Perfecto! Tu [producto] llega mañana entre 2-4 PM. ¡Muchas gracias por confiar en TechStore! Que tengas excelente día. ¡Hasta pronto!"

TU MISIÓN:
Progresa naturalmente hacia el cierre. Si ya confirmó compra, DESPÍDETE. No repitas información. Máximo 60 palabras, natural y efectivo.

Cliente dice: "${userMessage}"

Responde como Luis vendedor experto:`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 30,
                        topP: 0.85,
                        maxOutputTokens: 100,
                    }
                };

                try {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 4000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const rawResponse = data.candidates[0].content.parts[0].text.trim();
                        
                        const optimizedResponse = this.optimizeForElevenLabs(rawResponse);
                        
                        return optimizedResponse;
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando fallback:', error);
                    return this.getExpertFallbackResponse(userMessage);
                }
            }

            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // PRECIOS (Solo dinero lleva "pesos")
                optimized = optimized.replace(/(\d{1,3}(?:[.,]\d{3})*)\s*mil(?:\s*pesos)?/gi, (match, number) => {
                    const num = parseInt(number.replace(/[.,]/g, '')) * 1000;
                    return this.numberToSpanishWords(num) + ' pesos';
                });
                
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
                    if (cleanNumber > 10000) { // Solo números grandes son precios
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber); // Números pequeños sin "pesos"
                });
                
                // ESPECIFICACIONES TÉCNICAS (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*GB/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' gigabytes';
                });
                
                optimized = optimized.replace(/(\d+)\s*MP/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' megapíxeles';
                });
                
                // MESES (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*meses?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' meses';
                });
                
                // AÑOS (Sin "pesos") 
                optimized = optimized.replace(/(\d+)\s*años?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' años';
                });
                
                // PROCESADORES
                optimized = optimized.replace(/i(\d+)/gi, 'i-$1');
                optimized = optimized.replace(/RTX\s*(\d+)/gi, 'RTX $1');
                
                return optimized;
            }

            numberToSpanishWords(number) {
                if (number === 0) return 'cero';
                if (number === 100) return 'cien';
                
                const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
                const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
                const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
                
                if (number < 10) return ones[number];
                
                if (number < 20) return teens[number - 10];
                
                if (number < 30) {
                    return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
                }
                
                if (number < 100) {
                    return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
                }
                
                if (number < 1000) {
                    const hundred = Math.floor(number / 100);
                    const remainder = number % 100;
                    return hundreds[hundred] + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                if (number < 1000000) {
                    const thousands = Math.floor(number / 1000);
                    const remainder = number % 1000;
                    const thousandsText = thousands === 1 ? 'mil' : this.numberToSpanishWords(thousands) + ' mil';
                    return thousandsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                // Millones
                const millions = Math.floor(number / 1000000);
                const remainder = number % 1000000;
                const millionsText = millions === 1 ? 'un millón' : this.numberToSpanishWords(millions) + ' millones';
                return millionsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
            }

            getExpertFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('sí') && (msg.includes('quiero') || msg.includes('comprar'))) {
                    return '¡Excelente decisión! Dame tu nombre completo y dirección en Bogotá. Llega entre veinticuatro y cuarenta y ocho horas con entrega gratis. ¡Muchas gracias por confiar en TechStore! Que tengas excelente día.';
                }
                
                if (msg.includes('precio') && msg.includes('laptop')) {
                    return 'Para creación de contenido recomiendo la ASUS ROG G catorce. Excelente procesador y tarjeta gráfica, doscientos cincuenta y seis gigabytes de almacenamiento. Precio: dos millones trescientos cincuenta mil pesos con financiación disponible. ¿Te parece bien?';
                }
                
                const expertResponses = [
                    'Como especialista con quince años en tecnología, tengo exactamente lo que buscas. Cuéntame más detalles para hacer la recomendación perfecta.',
                    'Perfecto. He asesorado a miles de clientes. Dame más información sobre el uso principal para recomendarte lo mejor.',
                    'Excelente consulta. ¿Para qué lo necesitas principalmente? Así te ayudo mejor.'
                ];
                
                return expertResponses[Math.floor(Math.random() * expertResponses.length)];
            }

            async speakResponse(text) {
                console.log('🗣️ Luis hablando:', text);
                
                this.isLuisSpeaking = true;
                this.updateCallStatus('🗣️ Luis IA hablando...', 'speaking');
                this.luisStatusEl.textContent = 'Hablando';
                this.audioVisualizer.classList.add('active');
                this.transcriptContent.textContent = `Luis: "${text}"`;
                
                this.deactivateMicrophone();

                try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': this.ELEVENLABS_API_KEY
                        },
                        body: JSON.stringify({
                            text: text,
                            model_id: "eleven_turbo_v2_5",
                            voice_settings: {
                                stability: 0.65,
                                similarity_boost: 0.75,
                                style: 0.4
                            }
                        })
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            console.log('✅ Luis terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isLuisSpeaking = false;
                            this.audioVisualizer.classList.remove('active');
                            this.luisStatusEl.textContent = 'Escuchando';
                            this.transcriptContent.textContent = '🎤 Luis terminó - Tu turno';
                            
                            if (this.isCallActive && !this.isGoodbyeMessage(text)) {
                                this.microphoneTimer = setTimeout(() => {
                                    this.activateMicrophone();
                                }, 1000);
                            }
                        };
                        
                        await this.currentAudio.play();
                        
                    } else {
                        throw new Error('ElevenLabs error');
                    }
                    
                } catch (error) {
                    console.error('Error ElevenLabs:', error);
                    this.speakWithBrowser(text);
                }
            }

            speakWithBrowser(text) {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-ES';
                    utterance.volume = this.volume;
                    
                    utterance.onend = () => {
                        console.log('✅ Luis terminó de hablar (navegador)');
                        this.isLuisSpeaking = false;
                        this.audioVisualizer.classList.remove('active');
                        this.luisStatusEl.textContent = 'Escuchando';
                        this.transcriptContent.textContent = '🎤 Luis terminó - Tu turno';
                        
                        if (this.isCallActive) {
                            this.microphoneTimer = setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    this.isLuisSpeaking = false;
                    this.audioVisualizer.classList.remove('active');
                    this.transcriptContent.textContent = 'Sin audio - Tu turno';
                    
                    if (this.isCallActive) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                }
            }

            async startCall() {
                console.log('📞 Iniciando llamada...');
                
                this.isCallActive = true;
                this.callStartTime = new Date();
                this.callButton.innerHTML = '<i class="fas fa-phone-slash"></i> Finalizar Llamada';
                this.callButton.classList.add('active');
                this.stopButton.style.display = 'inline-block';
                
                this.updateCallStatus('📞 Llamada conectada', 'connected');
                this.luisStatusEl.textContent = 'Iniciando';
                
                // Limpiar historial
                this.conversationHistory.innerHTML = `
                    <h3 style="color: var(--tech-glow); margin-bottom: 15px; text-align: center;">
                        <i class="fas fa-history"></i> Historial de Conversación
                    </h3>
                `;
                
                this.startCallDuration();
                
                const greeting = '¡Hola! Buen día, habla Luis Martínez de TechStore. Vi que escribiste por nuestro Instagram mostrando interés en tecnología. Me da mucho gusto contactarte personalmente para asesorarte. Cuéntame, ¿qué tipo de equipo tienes en mente?';
                
                this.addToConversation(greeting, 'luis');
                
                await this.speakResponse(greeting);
            }

            endCall() {
                console.log('📞 Finalizando llamada...');
                
                this.isCallActive = false;
                this.isLuisSpeaking = false;
                this.isProcessingResponse = false;
                
                this.callButton.innerHTML = '<i class="fas fa-phone"></i> Iniciar Llamada';
                this.callButton.classList.remove('active');
                this.stopButton.style.display = 'none';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                clearInterval(this.durationInterval);
                
                this.updateCallStatus('📞 Llamada finalizada', 'waiting');
                this.luisStatusEl.textContent = 'Disponible';
                this.transcriptContent.textContent = 'Llamada terminada. ¡Gracias por contactar TechStore!';
            }

            startCallDuration() {
                this.durationInterval = setInterval(() => {
                    if (this.callStartTime) {
                        const now = new Date();
                        const duration = Math.floor((now - this.callStartTime) / 1000);
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            }

            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isLuisSpeaking = false;
                this.audioVisualizer.classList.remove('active');
            }

            toggleVolume() {
                if (this.volume > 0.5) {
                    this.volume = 0.3;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-down"></i> Volumen: Medio';
                } else if (this.volume > 0.1) {
                    this.volume = 0;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i> Volumen: Mudo';
                } else {
                    this.volume = 0.8;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-up"></i> Volumen: Alto';
                }
                
                if (this.currentAudio) {
                    this.currentAudio.volume = this.volume;
                }
            }

            updateCallStatus(message, type) {
                this.callStatus.innerHTML = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                this.micIndicator.className = `microphone-indicator ${active ? 'active' : ''}`;
            }

            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = `conversation-item ${speaker}`;
                
                const label = document.createElement('div');
                label.className = 'speaker-label';
                label.textContent = speaker === 'customer' ? 'Cliente' : 'Luis IA';
                
                const content = document.createElement('div');
                content.textContent = message;
                
                conversationItem.appendChild(label);
                conversationItem.appendChild(content);
                
                this.conversationHistory.appendChild(conversationItem);
                this.conversationHistory.scrollTop = this.conversationHistory.scrollHeight;
                
                // Detectar nombre del cliente
                if (speaker === 'customer' && !this.clientName) {
                    const nameMatch = message.match(/soy\s+(\w+)|me\s+llamo\s+(\w+)|mi\s+nombre\s+es\s+(\w+)/i);
                    if (nameMatch) {
                        this.clientName = nameMatch[1] || nameMatch[2] || nameMatch[3];
                    }
                }
                
                this.conversationHistory.push({
                    speaker: speaker,
                    message: message,
                    timestamp: new Date()
                });
                
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }
            }
        }

        // Inicializar sistema cuando la página carga
        document.addEventListener('DOMContentLoaded', () => {
            new LuisTechSystem();
        });