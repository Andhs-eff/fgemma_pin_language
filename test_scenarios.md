# Test Scenarios for Voice PIN & Language Verifier

## Scenario 1: Successful Verification
**Steps:**
1. Navigate to [https://andhs-eff.github.io/fgemma_pin_language](https://andhs-eff.github.io/fgemma_pin_language) (or download `index.html` and `index.js` and open `index.js`)
2. Wait for "Loading AI Model..." to change to "Ready to verify"
3. Click microphone button
4. Say: "My PIN is seven nine seven nine"
5. Wait for response: "Please choose the language"
6. Click microphone button again
7. Say: "I want Spanish language"
8. Wait for response: "Now I will connect to the interpreter"
9. Verify all input controls are disabled:
   - Microphone button disabled (greyed out)
   - Send button disabled (greyed out)
   - Input field disabled with placeholder "Verification complete!"
   - Status shows "Verification complete!"

**Expected Result:**
- ✓ AI extracts PIN 7979
- ✓ AI extracts language "Spanish"
- ✓ App completes verification
- ✓ Mic button disabled
- ✓ Send button disabled
- ✓ Input field disabled
- ✓ All UI elements locked

## Scenario 2: Incorrect PIN
**Steps:**
1. Open app and wait for ready state
2. Click microphone button
3. Say: "My PIN is one two three four"
4. Wait for response: "PIN is incorrect. Try again"
5. Click microphone button
6. Say: "My code is 7979"
7. Continue with Scenario 1 steps 5-9

**Expected Result:**
- ✓ AI rejects incorrect PIN (1234)
- ✓ Accepts correct PIN (7979) on retry
- ✓ Continues to language verification

## Scenario 3: Incorrect Language
**Steps:**
1. Complete PIN verification with 7979
2. Click microphone button for language
3. Say: "I choose French"
4. Wait for response: "Please choose another language"
5. Click microphone button
6. Say: "Spanish please"
7. Wait for success message

**Expected Result:**
- ✓ AI rejects incorrect language (French)
- ✓ Accepts correct language (Spanish) on retry
- ✓ Completes verification

## Scenario 4: Natural Language Variations
Test different ways users might speak:

**For PIN:**
- "The PIN is 7979"
- "My code is seven nine seven nine"
- "I'll use 7979 as my PIN"
- "7979 is my PIN number"

**For Language:**
- "Spanish language"
- "I'd like Spanish"
- "Let's use Spanish"
- "Choose Spanish"

**Expected Result:**
- ✓ AI should extract PIN/language from various phrasings
- ✓ Function calls should execute correctly

## Scenario 5: Manual Input (Testing)
**Steps:**
1. Open app and wait for ready
2. Type in text field: "my pin is 7979"
3. Click "Send" button
4. Verify response: "Please choose the language"
5. Type: "spanish"
6. Click "Send"
7. Verify completion:
   - Final message: "Now I will connect to the interpreter"
   - Microphone button disabled (greyed out)
   - Send button disabled (greyed out)
   - Input field disabled with placeholder "Verification complete!"

**Expected Result:**
- ✓ Manual input works as alternative to voice
- ✓ Same AI processing for typed input
- ✓ Same verification flow
- ✓ All input controls disabled upon completion

## Scenario 6: Edge Cases

### No PIN detected
**Input:** "Hello, how are you?"
**Expected:** "I couldn't find a PIN number in your input..."

### Invalid PIN format
**Input:** "My PIN is ABC"
**Expected:** AI should try to extract or fail gracefully

### Multiple numbers
**Input:** "My numbers are 1234 and 7979"
**Expected:** AI should extract one PIN (preferably 7979 if mentioned)

### Multiple languages
**Input:** "I speak English and Spanish"
**Expected:** AI should extract one language

## Scenario 7: Error Conditions

### No microphone access
**Test:** Deny microphone permission
**Expected:** Manual input still works, status shows warning

### Speech recognition error
**Test:** Speak very quietly or in noisy environment
**Expected:** Error message, option to retry or type manually

### Model loading failure
**Test:** Simulate network failure during model load
**Expected:** Clear error message, retry option

## Verification Checklist

- [ ] Model loads successfully
- [ ] Initial message spoken: "Please speak your pin code"
- [ ] Microphone button enabled after load
- [ ] Speech recognition works
- [ ] AI extracts PIN from speech
- [ ] PIN verification works (7979 = success, others = retry)
- [ ] State transitions: PIN → Language → Complete
- [ ] AI extracts language from speech
- [ ] Language verification works (Spanish = success, others = retry)
- [ ] Final message: "Now I will connect to the interpreter"
- [ ] Microphone disabled on completion
- [ ] Manual input works as alternative
- [ ] UI updates reflect current state
- [ ] Status indicators show correct state
- [ ] Error handling for failed recognition
- [ ] Text-to-speech works for all responses

## Performance Notes

- Model load time: 30-60 seconds (first time)
- Speech recognition: Near real-time
- AI processing: 1-3 seconds per function call
- Memory usage: ~500MB for AI model
- Browser compatibility: Chrome/Edge with WebGPU

## Debugging Tips

1. **Check browser console** for errors
2. **Verify WebGPU support**: chrome://gpu
3. **Check microphone permissions**
4. **Model loading issues**: Check network, try reloading
5. **Speech recognition issues**: Try different microphone, check background noise
6. **Function calling issues**: Check console for AI response parsing