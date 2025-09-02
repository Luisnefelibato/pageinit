class AndresOnVacationSystem {
            constructor() {
                // APIs - CONFIGURACIÓN
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'wmXH34EF7LAsKTjOZWWt'; // Voz masculina para Andrés
                
                // Estados principales
                this.isCallActive = false;
                this.isAndresSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio y reconocimiento
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.microphoneTimer = null;
                
                // Datos de conversación
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.customerName = null;
                this.travelPhase = 'initial';
                
                // Elementos DOM
                this.initializeDOMElements();
                this.initializeSystem();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.endCallButton = document.getElementById('endCallButton');
                this.callStatus = document.getElementById('callStatus');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                
                // Estadísticas
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.callStatusEl = document.getElementById('callStatus2');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Andrés OnVacation System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('🏝️ Andrés listo para planificar tu viaje soñado', 'waiting');
                console.log('✅ Sistema turístico inicializado correctamente');
            }

            // === CONFIGURACIÓN DE EVENTOS ===
            setupEventListeners() {
                this.callButton.addEventListener('click', () => {
                    if (this.isCallActive) {
                        this.endCall();
                    } else {
                        this.startCall();
                    }
                });

                this.endCallButton.addEventListener('click', () => {
                    this.endCall();
                });
            }

            // === RECONOCIMIENTO DE VOZ ===
            initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Reconocimiento de voz no soportado');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-CO';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('🎤 Reconocimiento iniciado');
                    this.isMicrophoneActive = true;
                    this.updateCallStatus('🎧 Andrés escucha - Cuéntame tu viaje ideal', 'listening');
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
                        this.transcriptDisplay.textContent = `🎤 "${currentText.trim()}"`;
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
                    this.isMicrophoneActive = false;
                    
                    if (this.isCallActive && !this.isAndresSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.isMicrophoneActive = false;
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isAndresSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            // === CONTROL DE MICRÓFONO ===
            activateMicrophone() {
                if (!this.isCallActive || this.isAndresSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
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
                
                this.isMicrophoneActive = false;
                
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

            // === PROCESAMIENTO DE ENTRADA DEL USUARIO ===
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.interactionsEl.textContent = this.interactionCount;
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Andrés buscando las mejores opciones...', 'processing');
                this.callStatusEl.textContent = 'Procesando';

                const startTime = performance.now();

                try {
                    const response = await this.generateResponse(userMessage);
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    this.addToConversation(response, 'agent');
                    
                    this.isProcessingResponse = false;
                    
                    // Detectar si es cierre de venta
                    if (this.isBookingConfirmation(response)) {
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
                    const fallbackResponse = '¿Podrías repetir eso? Quiero asegurarme de ofrecerte el mejor viaje.';
                    this.addToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // Detectar confirmación de reserva
            isBookingConfirmation(message) {
                const confirmationKeywords = [
                    'confirmada tu reserva',
                    'que disfrutes tu viaje',
                    'buen viaje',
                    'nos vemos en el aeropuerto',
                    'reserva exitosa',
                    'todo listo para tu viaje'
                ];
                
                const lowerMessage = message.toLowerCase();
                return confirmationKeywords.some(keyword => lowerMessage.includes(keyword));
            }

            // === GENERACIÓN DE RESPUESTAS OPTIMIZADA ===
            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Cliente' : 'Andrés'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Andrés Ramírez, agente de turismo EXPERTO de OnVacation con 12 años coordinando viajes paradisíacos.

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS:
- Precios: "dos millones quinientos mil pesos" NO "2,500,000 pesos"
- Noches: "siete noches" NO "7 noches"  
- Días: "cinco días" NO "5 días"
- Personas: "cuatro personas" NO "4 personas"
- Fechas: "quince de diciembre" NO "15 de diciembre"
- Años: "dos mil veinticuatro" NO "2024"
- SOLO dinero lleva "pesos" al final

PERSONALIDAD:
- Agente turístico humano real (NUNCA mencionar "IA")
- Apasionado por viajar y entusiasta
- Especialista en destinos paradisíacos
- Enfocado en cerrar reservas
- Asesor personal de confianza

DESTINOS ESTRELLA:
- Maldivas: Overwater bungalows (4,800,000 pesos - 7 noches)
- Bali Indonesia: Todo incluido (3,200,000 pesos - 6 noches)  
- Santorini Grecia: Romance mediterráneo (2,800,000 pesos - 5 noches)
- San Andrés: Caribe colombiano (1,400,000 pesos - 4 noches)
- Cartagena: Historia y playa (900,000 pesos - 3 noches)
- Tulum México: Cenotes y cultura (2,100,000 pesos - 5 noches)

TÉCNICAS DE VENTA:
1. ESCUCHA: Identifica tipo de viaje deseado (romántico, familiar, aventura)
2. RECOMIENDA: Un destino perfecto con detalles específicos
3. INCLUYE: Vuelos, hotel, comidas, excursiones, traslados
4. PRECIO: Una vez, con financiamiento disponible
5. URGENCIA: Promociones limitadas o fechas especiales
6. CIERRE: Coordina fechas y reserva cuando confirme

INFORMACIÓN COMPLETA:
- Vuelos incluidos desde Bogotá con Avianca/LATAM
- Hoteles 4-5 estrellas con desayuno incluido
- Traslados aeropuerto-hotel-aeropuerto
- Seguro de viaje internacional incluido
- Excursiones opcionales disponibles
- Documentación: Pasaporte vigente mínimo 6 meses

FINANCIAMIENTO:
- Tarjeta crédito: Hasta doce cuotas sin interés
- Banco: Hasta veinticuatro cuotas con tres punto cinco por ciento mensual
- Anticipo: Treinta por ciento para apartar

DESPEDIDA AUTOMÁTICA:
Si confirma la reserva ("sí, quiero reservar", "apartemos", etc.):
- Coordina fechas específicas
- Solicita datos para reserva
- Agradece cálidamente
- Despídete: "¡Excelente [Nombre]! Tu viaje a [destino] está confirmado para [fechas]. Te contacto mañana con los detalles finales. ¡Que disfrutes mucho tu aventura paradisíaca!"

TU MISIÓN:
Progresa hacia la reserva. Si ya confirmó, DESPÍDETE. Máximo sesenta palabras, natural y vendedor experto.

Cliente dice: "${userMessage}"

Responde como Andrés especialista en turismo:`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 30,
                        topP: 0.85,
                        maxOutputTokens: 120,
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
                        
                        // Optimizar para ElevenLabs
                        const optimizedResponse = this.optimizeForElevenLabs(rawResponse);
                        this.updateTravelPhase(userMessage, optimizedResponse);
                        
                        return optimizedResponse;
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando fallback:', error);
                    return this.getTourismFallbackResponse(userMessage);
                }
            }

            // === OPTIMIZACIÓN PARA ELEVENLABS ===
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // 1. PRECIOS (Solo dinero lleva "pesos")
                optimized = optimized.replace(/(\d{1,3}(?:[.,]\d{3})*)\s*mil(?:\s*pesos)?/gi, (match, number) => {
                    const num = parseInt(number.replace(/[.,]/g, '')) * 1000;
                    return this.numberToSpanishWords(num) + ' pesos';
                });
                
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[$.,]/g, ''));
                    if (cleanNumber > 50000) { // Solo números grandes son precios
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber); // Números pequeños sin "pesos"
                });
                
                // 2. NOCHES Y DÍAS (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*noches?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' noches';
                });
                
                optimized = optimized.replace(/(\d+)\s*días?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' días';
                });
                
                // 3. PERSONAS (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*personas?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' personas';
                });
                
                // 4. MESES (Sin "pesos")
                optimized = optimized.replace(/(\d+)\s*meses?/gi, (match, number) => {
                    return this.numberToSpanishWords(parseInt(number)) + ' meses';
                });
                
                // 5. AÑOS (Sin "pesos") 
                optimized = optimized.replace(/(\d{4})/g, (match, year) => {
                    return this.numberToSpanishWords(parseInt(year));
                });
                
                // 6. FECHAS
                optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
                    return `el ${this.numberToSpanishWords(parseInt(day))} del ${this.numberToSpanishWords(parseInt(month))} del ${this.numberToSpanishWords(parseInt(year))}`;
                });
                
                return optimized;
            }

            // === CONVERSIÓN NÚMEROS A ESPAÑOL ===
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

            updateTravelPhase(userMessage, andresResponse) {
                const combined = (userMessage + ' ' + andresResponse).toLowerCase();
                
                if (combined.includes('reservar') || combined.includes('apartar') || combined.includes('confirmada')) {
                    this.travelPhase = 'booking_confirmed';
                } else if (combined.includes('precio') || combined.includes('cuesta')) {
                    this.travelPhase = 'price_negotiation';
                } else if (combined.includes('fechas') || combined.includes('cuando')) {
                    this.travelPhase = 'date_planning';
                } else if (combined.includes('destino') || combined.includes('viaje')) {
                    this.travelPhase = 'destination_selection';
                }
            }

            // === FALLBACK TURÍSTICO ===
            getTourismFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('reservar') || msg.includes('apartar')) {
                    return '¡Perfecto! Vamos a coordinar tu reserva. Dame tus fechas preferidas y datos completos. Tu viaje soñado está a un paso. ¡Gracias por confiar en OnVacation!';
                }
                
                if (msg.includes('playa') || msg.includes('mar')) {
                    return 'Para playa paradisíaca recomiendo Maldivas con bungalows sobre el agua, cuatro millones ochocientos mil pesos por siete noches todo incluido. ¿Te interesa conocer más detalles?';
                }
                
                if (msg.includes('barato') || msg.includes('económico')) {
                    return 'Tengo una promoción especial a San Andrés: cuatro días, tres noches por un millón cuatrocientos mil pesos con vuelos incluidos. Hotel frente al mar y desayunos. ¿Te parece perfecto?';
                }
                
                const fallbackResponses = [
                    'Excelente pregunta. Como especialista en destinos paradisíacos, necesito conocer qué tipo de experiencia buscas para recomendarte lo perfecto.',
                    'Perfecto. Cuéntame más detalles sobre tu viaje ideal: ¿romántico, familiar, aventura? Así te diseño el paquete perfecto.',
                    'Como agente con doce años organizando viajes soñados, necesito entender mejor tus preferencias. ¿Qué destino tienes en mente?'
                ];
                
                return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            }

            // === REPRODUCCIÓN DE AUDIO ===
            async speakResponse(text) {
                console.log('🗣️ Andrés hablando:', text);
                
                this.isAndresSpeaking = true;
                this.updateCallStatus('🗣️ Andrés te asesora sobre tu viaje...', 'speaking');
                this.callStatusEl.textContent = 'Hablando';
                this.audioVisualizer.style.display = 'block';
                this.transcriptDisplay.textContent = `Andrés: "${text}"`;
                
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
                            console.log('✅ Andrés terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isAndresSpeaking = false;
                            this.audioVisualizer.style.display = 'none';
                            this.callStatusEl.textContent = 'Escuchando';
                            this.transcriptDisplay.textContent = '🎤 Andrés terminó - Cuéntame más sobre tu viaje ideal';
                            
                            if (this.isCallActive && !this.isBookingConfirmation(text)) {
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
                        console.log('✅ Andrés terminó de hablar (navegador)');
                        this.isAndresSpeaking = false;
                        this.audioVisualizer.style.display = 'none';
                        this.callStatusEl.textContent = 'Escuchando';
                        this.transcriptDisplay.textContent = '🎤 Andrés terminó - Tu turno';
                        
                        if (this.isCallActive) {
                            this.microphoneTimer = setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    this.isAndresSpeaking = false;
                    this.audioVisualizer.style.display = 'none';
                    this.transcriptDisplay.textContent = 'Sin audio - Tu turno';
                    
                    if (this.isCallActive) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                }
            }

            // === CONTROL DE LLAMADA ===
            async startCall() {
                console.log('📞 Iniciando llamada turística...');
                
                this.isCallActive = true;
                this.callStartTime = new Date();
                this.callButton.style.display = 'none';
                this.endCallButton.style.display = 'flex';
                
                this.updateCallStatus('📞 Conectando con Andrés OnVacation...', 'connected');
                this.callStatusEl.textContent = 'Conectando';
                this.audioVisualizer.style.display = 'block';
                
                this.startCallDurationTimer();
                
                const greeting = '¡Hola! Habla Andrés Ramírez de OnVacation, tu agente de viajes personal. Me da muchísima alegría contactarte porque sé que estás buscando esa escapada perfecta. Cuéntame, ¿qué tipo de experiencia tienes en mente? ¿Algo romántico, familiar, o tal vez una aventura única?';
                
                this.addToConversation(greeting, 'agent');
                this.travelPhase = 'discovery';
                
                setTimeout(() => {
                    this.updateCallStatus('✅ Llamada conectada - Andrés te escucha', 'connected');
                    this.callStatusEl.textContent = 'Conectado';
                }, 2000);
                
                await this.speakResponse(greeting);
            }

            endCall() {
                console.log('📞 Finalizando llamada turística...');
                
                this.isCallActive = false;
                this.isAndresSpeaking = false;
                this.isProcessingResponse = false;
                
                this.callButton.style.display = 'flex';
                this.endCallButton.style.display = 'none';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                clearInterval(this.callDurationInterval);
                
                this.updateCallStatus('🏝️ Llamada finalizada - Andrés listo para tu próximo viaje', 'waiting');
                this.callStatusEl.textContent = 'Desconectado';
                this.transcriptDisplay.textContent = 'Llamada terminada. ¡Que tengas excelente día y buen viaje! ✈️';
            }

            // === CONTROL DE AUDIO ===
            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isAndresSpeaking = false;
                this.audioVisualizer.style.display = 'none';
            }

            startCallDurationTimer() {
                this.callDurationInterval = setInterval(() => {
                    if (this.callStartTime) {
                        const now = new Date();
                        const duration = Math.floor((now - this.callStartTime) / 1000);
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            }

            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = 'conversation-item';
                
                if (speaker === 'customer') {
                    conversationItem.className += ' customer-message';
                    conversationItem.innerHTML = `
                        <div class="message-label">🧳 Cliente</div>
                        <div>${message}</div>
                    `;
                } else {
                    conversationItem.className += ' agent-message';
                    conversationItem.innerHTML = `
                        <div class="message-label">🏝️ Andrés OnVacation</div>
                        <div>${message}</div>
                    `;
                }

                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;

                // Mantener solo últimas 8 conversaciones
                while (this.conversationDisplay.children.length > 8) {
                    this.conversationDisplay.removeChild(this.conversationDisplay.firstChild);
                }
                
                // Detectar nombre del cliente
                if (speaker === 'customer' && !this.customerName) {
                    const nameMatch = message.match(/soy\s+(\w+)|me\s+llamo\s+(\w+)|mi\s+nombre\s+es\s+(\w+)/i);
                    if (nameMatch) {
                        this.customerName = nameMatch[1] || nameMatch[2] || nameMatch[3];
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

        // Initialize demo when page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.andresSystem = new AndresOnVacationSystem();
        });