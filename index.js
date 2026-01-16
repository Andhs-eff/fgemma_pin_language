import { AutoModelForCausalLM, AutoTokenizer } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

// Application State
const STATE = {
    appState: 'PIN_VERIFICATION', // 'PIN_VERIFICATION', 'LANGUAGE_VERIFICATION', 'COMPLETE'
    aiModel: null,
    tokenizer: null,
    isModelLoaded: false,
    isRecording: false,
    speechRecognition: null,
    speechSynthesis: window.speechSynthesis,
    currentUserInput: '',
};

// Tool Schema for FunctionGemma
const TOOL_SCHEMA = [
    {
        type: "function",
        function: {
            name: "check_pin",
            description: "Check if the provided PIN is correct. The PIN usually is a 4-digit number.",
            parameters: {
                type: "object",
                properties: {
                    pin: {
                        type: "string",
                        description: "The PIN number (consisting of digits) to verify"
                    }
                },
                required: ["pin"]
            },
            return: {
                type: "string",
                description: "Returns 'Please choose the language' if PIN is correct (7979), otherwise 'PIN is incorrect. Try again'"
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_language",
            description: "Check if the provided language is supported.",
            parameters: {
                type: "object",
                properties: {
                    language: {
                        type: "string",
                        description: "The name of the language to verify"
                    }
                },
                required: ["language"]
            },
            return: {
                type: "string",
                description: "Returns 'Now I will connect to the interpreter' if language is Spanish, otherwise 'Please choose another language'"
            }
        }
    }
];

// Actual tool implementations
const TOOLS = {
    check_pin: (pin) => {
        console.log(`check_pin called with: ${pin}`);
        if (pin === "7979") {
            return "Please choose the language";
        } else {
            return "PIN is incorrect. Try again";
        }
    },
    
    check_language: (language) => {
        console.log(`check_language called with: "${language}"`);
        const normalizedLanguage = language.toLowerCase().trim();
        if (normalizedLanguage === "spanish") {
            return "Now I will connect to the interpreter";
        } else {
            return "Please choose another language";
        }
    }
};

// DOM Elements
const aiResponseEl = document.getElementById('ai-response');
const micButton = document.getElementById('mic-button');
const recordingStatusEl = document.getElementById('recording-status');
const statusIndicatorEl = document.getElementById('status-indicator');
const statusTextEl = document.getElementById('status-text');
const statusDotEl = document.getElementById('status-dot');
const loadingOverlay = document.getElementById('loading-overlay');
const currentStepEl = document.getElementById('current-step');
const expectedActionEl = document.getElementById('expected-action');
const manualInputEl = document.getElementById('manual-input');
const sendButton = document.getElementById('send-button');

// Initialize the application
async function initApp() {
    try {
        await initModel();
        setupSpeechRecognition();
        setupEventListeners();
        updateUIState();
        speakInitialMessage();
    } catch (error) {
        setStatus('Error loading model: ' + error.message, 'error');
        console.error('Initialization error:', error);
    }
}

// Initialize AI Model
async function initModel() {
    try {
        setStatus('Loading AI model...', 'loading');
        
        // Load tokenizer and model
        STATE.tokenizer = await AutoTokenizer.from_pretrained('onnx-community/functiongemma-270m-it-ONNX');
        STATE.aiModel = await AutoModelForCausalLM.from_pretrained('onnx-community/functiongemma-270m-it-ONNX', {
            device: 'webgpu',
            dtype: 'q4',
        });
        
        STATE.isModelLoaded = true;
        loadingOverlay.style.display = 'none';
        setStatus('Ready to verify', 'ready');
        
        console.log('AI Model loaded successfully');
    } catch (error) {
        setStatus('Model loading failed', 'error');
        throw error;
    }
}

// Setup speech recognition
function setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        STATE.speechRecognition = new SpeechRecognition();
        STATE.speechRecognition.continuous = false;
        STATE.speechRecognition.interimResults = false;
        STATE.speechRecognition.lang = 'en-US';
        
        STATE.speechRecognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processUserInput(transcript);
        };
        
        STATE.speechRecognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
            setStatus('Speech recognition error', 'error');
            updateAIResponse('Sorry, I could not understand your speech. Please try again or type your input.');
            speakText('Sorry, I could not understand your speech. Please try again or type your input.');
        };
        
        STATE.speechRecognition.onend = () => {
            stopRecording();
        };
    } else {
        console.warn('Speech recognition not supported');
        setStatus('Speech recognition not supported', 'warning');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Microphone button
    micButton.addEventListener('click', toggleRecording);
    
    // Manual input send button
    sendButton.addEventListener('click', () => {
        const input = manualInputEl.value.trim();
        if (input) {
            processUserInput(input);
            manualInputEl.value = '';
        }
    });
    
    // Manual input Enter key
    manualInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const input = manualInputEl.value.trim();
            if (input) {
                processUserInput(input);
                manualInputEl.value = '';
            }
        }
    });
}

// Toggle recording state
function toggleRecording() {
    if (!STATE.isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

// Start recording
function startRecording() {
    if (STATE.speechRecognition && !STATE.isRecording) {
        try {
            STATE.speechRecognition.start();
            STATE.isRecording = true;
            micButton.classList.add('mic-active');
            recordingStatusEl.classList.remove('hidden');
            setStatus('Listening...', 'recording');
        } catch (error) {
            console.error('Error starting speech recognition:', error);
        }
    }
}

// Stop recording
function stopRecording() {
    if (STATE.isRecording) {
        STATE.isRecording = false;
        micButton.classList.remove('mic-active');
        recordingStatusEl.classList.add('hidden');
        setStatus('Ready to verify', 'ready');
    }
}

// Process user input
async function processUserInput(input) {
    console.log('User input:', input);
    STATE.currentUserInput = input;
    
    // Show user input
    updateAIResponse(`You said: "${input}"`);
    
    try {
        // Process based on current state
        if (STATE.appState === 'PIN_VERIFICATION') {
            await processPinVerification(input);
        } else if (STATE.appState === 'LANGUAGE_VERIFICATION') {
            await processLanguageVerification(input);
        }
    } catch (error) {
        console.error('Error processing input:', error);
        updateAIResponse('Error processing your input. Please try again.');
        speakText('Error processing your input. Please try again.');
    }
}

// Process PIN verification
async function processPinVerification(userInput) {
    setStatus('Processing PIN...', 'processing');
    
    // Prepare messages for FunctionGemma
    const messages = [
        {
            role: "developer",
            content: `You are a model that can do function calling with the following functions. Extract the PIN number from the user's input.
Example Session:
User: PIN is 7979
Model: <start_function_call>call:check_pin{pin:<escape>7979<escape>}<end_function_call>`
        },
        {
            role: "user",
            content: `User said: "${userInput}". Extract the PIN number.`
        }
    ];
    
    // Apply chat template
    const inputs = STATE.tokenizer.apply_chat_template(messages, {
        tools: [TOOL_SCHEMA[0]], // Only PIN tool
        tokenize: true,
        add_generation_prompt: true,
        return_dict: true,
    });

    console.log('Model Input (Decoded):', STATE.tokenizer.decode(inputs.input_ids[0]));    


    // Generate function call
    const output = await STATE.aiModel.generate({ 
        ...inputs, 
        max_new_tokens: 128, 
        do_sample: false 
    });
    
    const decoded = STATE.tokenizer.decode(output.slice(0, [inputs.input_ids.dims[1], null]), { 
        skip_special_tokens: false 
    });
    
    console.log('AI Response:', decoded);
    
    // Parse function call
    const pinResult = parseFunctionCall(decoded, 'check_pin');
    
    if (pinResult && pinResult.pin !== undefined) {
        // Execute the tool
        const toolResponse = TOOLS.check_pin(pinResult.pin);
        updateAIResponse(toolResponse);
        speakText(toolResponse);
        
        // Update state based on response
        if (toolResponse === "Please choose the language") {
            STATE.appState = 'LANGUAGE_VERIFICATION';
            updateUIState();
        } else {
            // Stay in PIN verification state
            updateUIState();
        }
    } else {
        // No valid PIN extracted
        updateAIResponse("I couldn't find a PIN number in your input. Please say something like 'My PIN is 1234'.");
        speakText("I couldn't find a PIN number in your input. Please say something like 'My PIN is 1234'.");
    }
    
    setStatus('Ready to verify', 'ready');
}

// Process language verification
async function processLanguageVerification(userInput) {
    setStatus('Processing language...', 'processing');
    
    // Prepare messages for FunctionGemma
    const messages = [
        {
            role: "developer",
            content: `You are a model that can do function calling with the following functions. Extract the language name from the user's input.
Example Session:
User: I choose Spanish
Model: <start_function_call>call:check_language{language:<escape>Spanish<escape>}<end_function_call>`
        },
        {
            role: "user",
            content: `User said: "${userInput}". Extract the language name.`
        }
    ];
    
    // Apply chat template
    const inputs = STATE.tokenizer.apply_chat_template(messages, {
        tools: [TOOL_SCHEMA[1]], // Only language tool
        tokenize: true,
        add_generation_prompt: true,
        return_dict: true,
    });

    console.log('Model Input (Decoded):', STATE.tokenizer.decode(inputs.input_ids[0]));     

    // Generate function call
    const output = await STATE.aiModel.generate({ 
        ...inputs, 
        max_new_tokens: 128, 
        do_sample: false 
    });
    
    const decoded = STATE.tokenizer.decode(output.slice(0, [inputs.input_ids.dims[1], null]), { 
        skip_special_tokens: false 
    });
    
    console.log('AI Response:', decoded);
    
    // Parse function call
    const languageResult = parseFunctionCall(decoded, 'check_language');
    
    if (languageResult && languageResult.language !== undefined) {
        // Execute the tool
        const toolResponse = TOOLS.check_language(languageResult.language);
        updateAIResponse(toolResponse);
        speakText(toolResponse);
        
        // Update state based on response
        if (toolResponse === "Now I will connect to the interpreter") {
            STATE.appState = 'COMPLETE';
            updateUIState(); // This will disable micButton, manualInputEl, and sendButton
            setStatus('Verification complete!', 'complete');
        } else {
            // Stay in language verification state
            updateUIState();
        }
    } else {
        // No valid language extracted
        updateAIResponse("I couldn't find a language name in your input. Please say something like 'I choose Spanish'.");
        speakText("I couldn't find a language name in your input. Please say something like 'I choose Spanish'.");
    }
    
    setStatus('Ready to verify', 'ready');
}

// Parse function call from AI response
function parseFunctionCall(decoded, expectedFunction) {
    const startTag = "<start_function_call>";
    const endTag = "<end_function_call>";
    const startIndex = decoded.indexOf(startTag);
    const endIndex = decoded.indexOf(endTag);
    
    if (startIndex !== -1 && endIndex !== -1) {
        let callStr = decoded.substring(startIndex + startTag.length, endIndex);
        
        // Check if this is the expected function
        if (callStr.startsWith(`call:${expectedFunction}`)) {
            try {
                // Extract JSON-like string
                let argsStr = callStr.substring(callStr.indexOf("{"));
                
                // Sanitize to valid JSON
                argsStr = argsStr
                    .replace(/<escape>(.*?)<escape>/g, '"$1"') // Handle string escapes
                    .replace(/(\w+):/g, '"$1":'); // Quote keys
                
                return JSON.parse(argsStr);
            } catch (error) {
                console.error('Error parsing function call:', error);
                return null;
            }
        }
    }
    
    return null;
}

// Update AI response display
function updateAIResponse(text) {
    aiResponseEl.textContent = text;
    aiResponseEl.classList.add('pulse');
    setTimeout(() => {
        aiResponseEl.classList.remove('pulse');
    }, 500);
}

// Update UI state based on app state
function updateUIState() {
    switch (STATE.appState) {
        case 'PIN_VERIFICATION':
            currentStepEl.textContent = 'PIN Verification';
            expectedActionEl.textContent = 'Speak a 4-digit PIN';
            micButton.disabled = false;
            manualInputEl.disabled = false;
            sendButton.disabled = false;
            manualInputEl.placeholder = "Type your PIN or say it...";
            break;
        case 'LANGUAGE_VERIFICATION':
            currentStepEl.textContent = 'Language Verification';
            expectedActionEl.textContent = 'Say "Spanish"';
            micButton.disabled = false;
            manualInputEl.disabled = false;
            sendButton.disabled = false;
            manualInputEl.placeholder = "Type language name or say it...";
            break;
        case 'COMPLETE':
            currentStepEl.textContent = 'Complete';
            expectedActionEl.textContent = 'Access granted';
            micButton.disabled = true;
            manualInputEl.disabled = true;
            sendButton.disabled = true;
            manualInputEl.placeholder = "Verification complete!";
            break;
    }
}

// Speak initial message
function speakInitialMessage() {
    if (STATE.isModelLoaded) {
        setTimeout(() => {
            speakText("Please speak your pin code");
        }, 1000);
    }
}

// Text to speech
function speakText(text) {
    if (STATE.speechSynthesis) {
        // Cancel any ongoing speech
        STATE.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Find a good voice
        const voices = STATE.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        if (englishVoice) {
            utterance.voice = englishVoice;
        }
        
        STATE.speechSynthesis.speak(utterance);
    }
}

// Update status display
function setStatus(text, type) {
    statusTextEl.textContent = text;
    
    // Update dot color based on type
    const colors = {
        'loading': 'bg-yellow-500',
        'ready': 'bg-green-500',
        'error': 'bg-red-500',
        'warning': 'bg-orange-500',
        'recording': 'bg-red-500',
        'processing': 'bg-blue-500',
        'complete': 'bg-purple-500'
    };
    
    // Remove all color classes
    statusDotEl.className = 'w-3 h-3 rounded-full mr-2 ' + (colors[type] || 'bg-gray-500');
    
    // Add pulse animation for loading and recording
    if (type === 'loading' || type === 'recording') {
        statusDotEl.classList.add('animate-pulse');
    } else {
        statusDotEl.classList.remove('animate-pulse');
    }
    
    // Update status indicator background
    const bgColors = {
        'loading': 'bg-yellow-100 text-yellow-800',
        'ready': 'bg-green-100 text-green-800',
        'error': 'bg-red-100 text-red-800',
        'warning': 'bg-orange-100 text-orange-800',
        'recording': 'bg-red-100 text-red-800',
        'processing': 'bg-blue-100 text-blue-800',
        'complete': 'bg-purple-100 text-purple-800'
    };
    
    statusIndicatorEl.className = `inline-flex items-center px-4 py-2 rounded-full mt-4 status-indicator ${bgColors[type] || 'bg-gray-100 text-gray-800'}`;
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle speech synthesis voices
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded');
    };
}