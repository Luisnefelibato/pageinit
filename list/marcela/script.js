class MarcelaRRHHSystem {
            constructor() {
                // APIs Configuration
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'VmejBeYhbrcTPwDniox7'; // Female voice for Marcela
                
                // System states
                this.isCallActive = false;
                this.isMarcelaSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Audio and recognition control
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                
                // Conversation data
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.candidateName = null;
                this.interviewPhase = 'initial';
                
                // DOM elements
                this.initializeDOMElements();
                this.initializeSystem();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.endCallButton = document.getElementById('endCallButton');
                this.callStatus = document.getElementById('callStatus');
                this.callStatus2 = document.getElementById('callStatus2');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.micIndicator = document.getElementById('micIndicator');
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Marcela RRHH System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('👩‍💼 Marcela lista para coordinar entrevistas', 'waiting');
                this.updateMicrophoneStatus(false);
                console.log('✅ Sistema Marcela inicializado correctamente');
            }

            setupEventListeners() {
                this.callButton.addEventListener('click', () => this.startCall());
                this.endCallButton.addEventListener('click', () => this.endCall());
            }

            // Voice Recognition Setup
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
                    this.updateMicrophoneStatus(true);
                    this.updateCallStatus('🎧 Marcela escucha - Habla cuando quieras', 'listening');
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
                        this.transcriptDisplay.classList.add('active');
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
                    this.handleRecognitionError();
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isMarcelaSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            // Microphone Control
            activateMicrophone() {
                if (!this.isCallActive || this.isMarcelaSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
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
                this.updateMicrophoneStatus(false);
                
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {
                        console.log('Recognition already stopped');
                    }
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            handleRecognitionError() {
                clearTimeout(this.silenceTimer);
                this.updateMicrophoneStatus(false);
                
                if (this.isCallActive && !this.isMarcelaSpeaking) {
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            // User Input Processing
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando:', userMessage);
                
                this.deactivateMicrophone();
                this.addMessageToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.interactionsEl.textContent = this.interactionCount;
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Marcela procesando información...', 'processing');
                this.callStatus2.textContent = 'Procesando';

                const startTime = performance.now();

                try {
                    const response = await this.generateResponse(userMessage);
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    this.addMessageToConversation(response, 'agent');
                    
                    this.isProcessingResponse = false;
                    
                    if (this.isGoodbyeMessage(response)) {
                        await this.speakResponse(response);
                        setTimeout(() => {
                            this.endCall();
                        }, 3000);
                    } else {
                        await this.speakResponse(response);
                    }
                    
                } catch (error) {
                    console.error('Error procesando:', error);
                    this.isProcessingResponse = false;
                    const fallbackResponse = 'Disculpa, ¿podrías repetir esa información?';
                    this.addMessageToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // AI Response Generation
            async generateResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                let interviewPhaseContext = this.determineInterviewPhase();
                
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Candidato' : 'Marcela'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Marcela Rodríguez, especialista en Recursos Humanos con 12 años de experiencia en procesos de selección.

CONTEXTO: Candidato contactó por proceso de selección. Ya hay comunicación previa establecida.

FASE ACTUAL DEL PROCESO: ${interviewPhaseContext}

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS (SÍNTESIS DE VOZ):
- Fechas: "quince de marzo" NO "15 de marzo"
- Horarios: "las dos y treinta" NO "2:30"
- Salarios: "tres millones de pesos" NO "$3,000,000"
- Números de contacto: separar dígitos "tres uno cero - dos cuatro cinco - seis siete ocho nueve"
- Documentos: "cédula de ciudadanía" completo
- Direcciones: "carrera quince número ochenta y cinco guión veinte"

PERSONALIDAD MARCELA:
- Profesional HR humana (NUNCA mencionar "IA" o "inteligencia artificial")
- Cálida pero profesional
- Organizada y detallista
- Enfocada en coordinar y confirmar
- Empática con candidatos

ESPECIALIZACIÓN RRHH:
1. CONFIRMACIÓN: Verificar asistencia a entrevistas
2. REPROGRAMACIÓN: Coordinar nuevas fechas si es necesario
3. PREPARACIÓN: Informar sobre requisitos y documentos
4. PROCESO: Explicar etapas de selección
5. BENEFICIOS: Describir paquete salarial y beneficios
6. COORDINACIÓN: Gestionar logística de entrevistas

TEMAS DE EXPERTICIA:
- Confirmación de entrevistas (fecha, hora, modalidad)
- Reprogramación por inconvenientes
- Documentos requeridos (hoja de vida, cédula, certificados)
- Información del cargo (requisitos, funciones, salario)
- Beneficios laborales (salud, pensión, primas, vacaciones)
- Proceso de selección (etapas, duración, decisión)
- Logística (ubicación, contactos, instrucciones)

FLUJO DE CONVERSACIÓN:
1. Si confirma asistencia → Dar detalles específicos
2. Si necesita reprogramar → Ofrecer alternativas
3. Si pregunta por cargo → Explicar requisitos y beneficios
4. Si pregunta documentos → Listar detalladamente
5. Si tiene dudas proceso → Aclarar etapas
6. Al finalizar → Confirmar datos y despedirse profesionalmente

DESPEDIDA AUTOMÁTICA:
Si todo está confirmado y claro:
"Perfecto [Nombre], entonces te esperamos el [día] a las [hora] en [lugar]. Lleva tu hoja de vida actualizada, cédula original y certificados. Si tienes algún inconveniente, no dudes en contactarnos. ¡Muchas gracias y que tengas excelente día!"

TU MISIÓN:
Coordinar eficientemente entrevistas y procesos. Ser organizada, clara y profesional. Máximo 60 palabras por respuesta, natural y efectiva.

Candidato dice: "${userMessage}"

Responde como Marcela especialista RRHH:`
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
                        this.updateInterviewPhase(userMessage, optimizedResponse);
                        
                        return optimizedResponse;
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando fallback:', error);
                    return this.getHRFallbackResponse(userMessage);
                }
            }

            // ElevenLabs Optimization
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // Fechas y horarios
                optimized = optimized.replace(/(\d{1,2}):(\d{2})/g, (match, hour, minute) => {
                    const hourText = this.numberToSpanishWords(parseInt(hour));
                    const minuteText = this.numberToSpanishWords(parseInt(minute));
                    return `las ${hourText} y ${minuteText}`;
                });
                
                optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (match, day, month, year) => {
                    return `el ${this.numberToSpanishWords(parseInt(day))} de ${this.getMonthName(parseInt(month))} del ${this.numberToSpanishWords(parseInt(year))}`;
                });
                
                // Salarios
                optimized = optimized.replace(/\$?\s*(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[.,]/g, ''));
                    if (cleanNumber >= 100000) {
                        return this.numberToSpanishWords(cleanNumber) + ' pesos';
                    }
                    return this.numberToSpanishWords(cleanNumber);
                });
                
                // Teléfonos
                optimized = optimized.replace(/(\d{3})\s*(\d{3})\s*(\d{4})/g, (match, p1, p2, p3) => {
                    return `${p1.split('').join(' ')} - ${p2.split('').join(' ')} - ${p3.split('').join(' ')}`;
                });
                
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
                if (number < 30) return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
                if (number < 100) return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
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
                
                const millions = Math.floor(number / 1000000);
                const remainder = number % 1000000;
                const millionsText = millions === 1 ? 'un millón' : this.numberToSpanishWords(millions) + ' millones';
                return millionsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
            }

            getMonthName(month) {
                const months = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                return months[month] || 'mes';
            }

            // Interview Phase Management
            determineInterviewPhase() {
                const lastMessages = this.conversationHistory.slice(-3);
                const allText = lastMessages.map(h => h.message.toLowerCase()).join(' ');
                
                if (allText.includes('confirmo') || allText.includes('sí asisto')) {
                    return 'CONFIRMACIÓN EXITOSA - DAR DETALLES FINALES';
                }
                if (allText.includes('reprogramar') || allText.includes('cambiar')) {
                    return 'REPROGRAMACIÓN NECESARIA';
                }
                if (allText.includes('salario') || allText.includes('beneficios')) {
                    return 'INFORMACIÓN SALARIAL';
                }
                if (allText.includes('documentos') || allText.includes('llevar')) {
                    return 'PREPARACIÓN DOCUMENTOS';
                }
                if (allText.includes('proceso') || allText.includes('etapas')) {
                    return 'EXPLICACIÓN PROCESO';
                }
                
                return 'CONFIRMACIÓN INICIAL';
            }

            updateInterviewPhase(userMessage, marcelaResponse) {
                const combined = (userMessage + ' ' + marcelaResponse).toLowerCase();
                
                if (combined.includes('confirmo') || combined.includes('te esperamos')) {
                    this.interviewPhase = 'confirmed';
                } else if (combined.includes('reprogramar') || combined.includes('otra fecha')) {
                    this.interviewPhase = 'rescheduling';
                } else if (combined.includes('salario') || combined.includes('beneficios')) {
                    this.interviewPhase = 'salary_discussion';
                } else if (combined.includes('documentos')) {
                    this.interviewPhase = 'document_preparation';
                }
            }

            // Fallback Response
            getHRFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                const phase = this.determineInterviewPhase();
                
                if (phase === 'CONFIRMACIÓN EXITOSA - DAR DETALLES FINALES') {
                    return 'Perfecto, entonces confirmada tu entrevista para mañana a las diez de la mañana. Lleva hoja de vida actualizada y cédula original. Te esperamos en el piso tres de la torre empresarial. ¡Excelente día!';
                }
                
                if (msg.includes('horario') || msg.includes('hora')) {
                    return 'Tengo disponibilidad mañana a las diez de la mañana o pasado mañana a las dos de la tarde. ¿Cuál horario te conviene más?';
                }
                
                const hrResponses = [
                    'Como especialista en recursos humanos, estoy aquí para coordinar tu proceso de selección. ¿En qué puedo ayudarte específicamente?',
                    'Perfecto, cuéntame más detalles para organizar mejor tu entrevista.',
                    'Claro, vamos paso a paso para confirmar toda la información necesaria.'
                ];
                
                return hrResponses[Math.floor(Math.random() * hrResponses.length)];
            }

            isGoodbyeMessage(message) {
                const goodbyeKeywords = [
                    'que tengas excelente día',
                    'te esperamos',
                    'hasta mañana',
                    'gracias por contactarnos',
                    'confirmada tu entrevista'
                ];
                
                const lowerMessage = message.toLowerCase();
                return goodbyeKeywords.some(keyword => lowerMessage.includes(keyword));
            }

            // Audio Processing
            async speakResponse(text) {
                console.log('🗣️ Marcela hablando:', text);
                
                this.isMarcelaSpeaking = true;
                this.updateCallStatus('🗣️ Marcela coordinando información...', 'speaking');
                this.callStatus2.textContent = 'Hablando';
                this.audioVisualizer.classList.add('active');
                this.transcriptDisplay.textContent = `Marcela: "${text}"`;
                this.transcriptDisplay.classList.remove('active');
                
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
                                stability: 0.70,
                                similarity_boost: 0.80,
                                style: 0.3
                            }
                        })
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            console.log('✅ Marcela terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isMarcelaSpeaking = false;
                            this.audioVisualizer.classList.remove('active');
                            this.callStatus2.textContent = 'Escuchando';
                            this.transcriptDisplay.textContent = '🎤 Marcela terminó - Tu turno';
                            
                            if (this.isCallActive && !this.isGoodbyeMessage(text)) {
                                setTimeout(() => {
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
                    utterance.rate = 0.9;
                    
                    utterance.onend = () => {
                        console.log('✅ Marcela terminó de hablar (navegador)');
                        this.isMarcelaSpeaking = false;
                        this.audioVisualizer.classList.remove('active');
                        this.callStatus2.textContent = 'Escuchando';
                        this.transcriptDisplay.textContent = '🎤 Marcela terminó - Tu turno';
                        
                        if (this.isCallActive) {
                            setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    this.handleAudioEnd();
                }
            }

            handleAudioEnd() {
                this.isMarcelaSpeaking = false;
                this.audioVisualizer.classList.remove('active');
                this.transcriptDisplay.textContent = 'Audio no disponible - Tu turno';
                
                if (this.isCallActive) {
                    setTimeout(() => this.activateMicrophone(), 500);
                }
            }

            // Call Management
            async startCall() {
                console.log('📞 Iniciando llamada...');
                
                this.isCallActive = true;
                this.callStartTime = new Date();
                this.startCallTimer();
                
                this.callButton.style.display = 'none';
                this.endCallButton.style.display = 'flex';
                
                this.updateCallStatus('📞 Conectando con Marcela...', 'connected');
                this.callStatus2.textContent = 'Conectando';
                
                this.audioVisualizer.classList.add('active');
                this.transcriptDisplay.classList.add('active');
                this.transcriptDisplay.textContent = 'Conectando llamada...';
                
                this.conversationDisplay.innerHTML = '';
                
                setTimeout(async () => {
                    if (!this.isCallActive) return;
                    
                    this.updateCallStatus('✅ Llamada conectada - Marcela coordinando', 'connected');
                    this.callStatus2.textContent = 'Conectado';
                    
                    const greeting = '¡Hola! Buenos días, habla Marcela Rodríguez del departamento de Recursos Humanos. Te contacto para confirmar tu entrevista programada. ¿Podrás asistir mañana a las diez de la mañana?';
                    
                    this.addMessageToConversation(greeting, 'agent');
                    this.interviewPhase = 'confirmation';
                    
                    await this.speakResponse(greeting);
                }, 2000);
            }

            endCall() {
                console.log('📞 Finalizando llamada...');
                
                this.isCallActive = false;
                this.isMarcelaSpeaking = false;
                this.isProcessingResponse = false;
                
                this.endCallButton.style.display = 'none';
                this.callButton.style.display = 'flex';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                this.updateCallStatus('👩‍💼 Marcela lista para coordinar entrevistas', 'waiting');
                this.callStatus2.textContent = 'Lista';
                
                this.audioVisualizer.classList.remove('active');
                this.transcriptDisplay.classList.remove('active');
                this.transcriptDisplay.textContent = 'Llamada finalizada. ¡Gracias por contactar RRHH!';
                
                if (this.callTimer) {
                    clearInterval(this.callTimer);
                    this.callTimer = null;
                }
                
                setTimeout(() => {
                    this.callDurationEl.textContent = '00:00';
                    this.conversationDisplay.innerHTML = `
                        <div style="text-align: center; color: #8696a0; padding: 2rem;">
                            <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--coral-primary);"></i>
                            <h3>Llamada Finalizada</h3>
                            <p>Proceso de selección coordinado exitosamente. ${this.interactionCount} interacciones procesadas.</p>
                        </div>
                    `;
                }, 1000);
            }

            startCallTimer() {
                this.callTimer = setInterval(() => {
                    if (this.callStartTime && this.isCallActive) {
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
                
                this.isMarcelaSpeaking = false;
                this.audioVisualizer.classList.remove('active');
            }

            // Status Updates
            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                this.micIndicator.className = `microphone-indicator ${active ? 'active' : ''}`;
                
                if (active) {
                    console.log('🎤 Micrófono activado');
                } else {
                    console.log('🔇 Micrófono desactivado');
                }
            }

            // Conversation Management
            addMessageToConversation(message, type) {
                const messageEl = document.createElement('div');
                messageEl.className = `conversation-item ${type === 'customer' ? 'customer-message' : 'agent-message'}`;
                
                const label = type === 'customer' ? 'Candidato' : 'Marcela RRHH';
                messageEl.innerHTML = `
                    <div class="message-label">${label}</div>
                    <div>${message}</div>
                `;
                
                this.conversationDisplay.appendChild(messageEl);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
                
                // Detect candidate name
                if (type === 'customer' && !this.candidateName) {
                    const nameMatch = message.match(/soy\s+(\w+)|me\s+llamo\s+(\w+)|mi\s+nombre\s+es\s+(\w+)/i);
                    if (nameMatch) {
                        this.candidateName = nameMatch[1] || nameMatch[2] || nameMatch[3];
                    }
                }
                
                this.conversationHistory.push({
                    speaker: type,
                    message: message,
                    timestamp: new Date()
                });
                
                // Keep conversation history manageable
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }
            }
        }

        // Initialize system when page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.marcelaSystem = new MarcelaRRHHSystem();
        });