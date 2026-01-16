# Voice PIN & Language Verifier

A web-based application that uses FunctionGemma AI model for voice-based PIN and language verification.

## Features

- **Voice Input**: Speak your PIN and language choice using microphone
- **AI-Powered Parsing**: FunctionGemma AI model extracts PIN numbers and language names from natural speech
- **Voice Output**: Text-to-speech responses in English
- **Two-Step Verification**: 
  1. PIN verification (correct PIN: 7979)
  2. Language verification (correct language: Spanish)
- **Modern UI**: Clean, responsive interface with visual feedback

## Project Structure

```
index.html    # Main HTML file
index.js      # Main JavaScript logic
README.md                  # This file
test_scenarios.md     #Test Scenarios for Voice PIN & Language Verifier
```

## How It Works

1. **Initial State**: 
   - App loads FunctionGemma AI model
   - Displays "Please speak your pin code" and speaks it

2. **PIN Verification**:
   - User speaks a PIN (e.g., "My PIN is 7979")
   - AI extracts PIN number using `check_pin` function
   - If PIN is correct (7979): Moves to language verification
   - If incorrect: Asks to try again

3. **Language Verification**:
   - User speaks a language (e.g., "I choose Spanish")
   - AI extracts language using `check_language` function
   - If language is Spanish: Verification complete
   - If other language: Asks to choose another

4. **Completion**:
   - Microphone button disabled
   - Send button disabled
   - Input field disabled
   - "Now I will connect to the interpreter" displayed and spoken
   - All input controls locked to prevent further interaction

## Setup and Usage

### Quick Start
1. Navigate to [https://andhs-eff.github.io/fgemma_pin_language](https://andhs-eff.github.io/fgemma_pin_language) in a modern web browser
2. Wait for AI model to load (may take 30-60 seconds)
3. Click the microphone button when prompted
4. Follow the voice instructions

### Manual Testing
You can also type your input in the text field and click "Send" button.

### Browser Requirements
- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Microphone access permissions
- Internet connection (for loading AI model)

## Technical Details

### AI Model
- **Model**: onnx-community/functiongemma-270m-it-ONNX
- **Library**: transformers.js v3.8.1
- **Features**: Function calling capabilities
- **Size**: Quantized (q4) for browser performance

### Function Schema
The app defines two functions for the AI model:

1. **check_pin(pin: number)**: 
   - Returns "Please choose the language" if PIN = 7979
   - Returns "PIN is incorrect. Try again" otherwise

2. **check_language(language: string)**:
   - Returns "Now I will connect to the interpreter" if language = "Spanish"
   - Returns "Please choose another language" otherwise

### Speech Features
- **Recognition**: Web Speech API (English only)
- **Synthesis**: Text-to-speech with English voices
- **Fallback**: Manual text input for testing

## Development

### Key Files
- **HTML**: Contains UI structure and styling
- **JavaScript**: Implements all logic including:
  - AI model initialization
  - Speech recognition/synthesis
  - State management
  - Function calling and parsing

### State Management
Three application states:
- `PIN_VERIFICATION`: Waiting for PIN input
- `LANGUAGE_VERIFICATION`: Waiting for language input  
- `COMPLETE`: Verification successful

### Testing
1. **Correct flow**: Say "my pin is 7979" → "i choose spanish"
2. **Incorrect PIN**: Say "my pin is 1234" → try again
3. **Incorrect language**: Say "i choose english" → try again
4. **Natural phrases**: The AI can extract from various phrasings

## Limitations

- Requires modern browser with WebGPU
- AI model loading time ~30-60 seconds
- Speech recognition quality depends on microphone and environment
- English language only for speech recognition/synthesis
- No backend/server - runs entirely in browser

## Future Enhancements

- Add support for more languages
- Implement PWA features
- Add visual animations for verification steps
- Support for multiple PINs/languages
- Error handling improvements
- Offline capabilities

## Credits

- Built with [transformers.js](https://github.com/xenova/transformers.js)
- Using [FunctionGemma](https://huggingface.co/onnx-community/functiongemma-270m-it-ONNX) model
- UI with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Font Awesome](https://fontawesome.com)

## License

MIT License - Free to use and modify for educational and personal purposes.

---

**Note**: This is a prototype demonstration of browser-based AI with function calling capabilities. The PIN 7979 and language "Spanish" are hardcoded for demonstration purposes.