# 💕 Hinge Dating System

A modular dating game feature for Tamagotchi Dario that allows players to match with different Lulu variants and engage in conversation mini-games.

## 🎮 Features

### Dating Profiles
- **6 Unique Lulu Variants**: Each with distinct personalities and interests
  - 🇫🇷 **French Lulu**: 28, loves cats, pizza from Mo, TJ Maxx, tangerine juice, travel, Simpsons
  - 🍕 **Foodie Lulu**: Pizza from Mo expert, Trader Joe's shopper
  - ✈️ **Travel Lulu**: French explorer, pet lover, Simpsons fan
  - 🛍️ **Shopping Lulu**: TJ Maxx treasure hunter with cat obsession
  - 📺 **Simpson Lulu**: Quotes Simpsons while sipping tangerine juice
  - 🎵 **Rondoudou (Jigglypuff)**: Pokémon who loves to sing lullabies

### Swipe Mechanics
- **Swipe Right**: Like a profile (+5 hearts when matched)
- **Swipe Left**: Pass on a profile
- **Reset System**: When all profiles viewed, option to reset and see them again
- **Match Management**: View and chat with existing matches

### Conversation System
Each profile has unique conversation trees:
- **2 Questions per character** with multiple choice answers
- **Correct answers** award +2 hearts and positive responses
- **Wrong answers** give humorous but less favorable responses
- **Progressive scoring** system with different relationship outcomes

## 🛠️ Technical Architecture

### Modular Design
```
modules/hinge/
├── conversation-system.js  # Main conversation logic
└── README.md              # Documentation
```

### Key Classes

#### `ConversationSystem`
- **Purpose**: Manages all dating conversations and question logic
- **Dependencies**: Game instance, SaveManager, UIManager
- **Methods**:
  - `startConversation(profileId)`: Begin chatting with a matched profile
  - `showQuestion()`: Display current question with multiple choice options
  - `answerQuestion()`: Process player's answer and advance conversation
  - `completeConversation()`: Handle end-of-conversation scoring and rewards

### Integration Points
- **Game Entry**: Available in Games menu (not external controls)
- **Save System**: Tracks conversation progress, matches, and profile viewing
- **UI System**: Uses existing modal system for all interactions
- **Currency System**: Awards hearts for matches and correct answers

## 💾 Save Data Structure

```javascript
save.hinge = {
    currentProfileIndex: 0,        // Current profile being shown
    swipedProfiles: [              // History of all swipe actions
        { id: 'french_lulu', action: 'like', timestamp: 1234567890 }
    ],
    matches: ['french_lulu'],      // Array of matched profile IDs
    conversations: {               // Conversation progress per profile
        'french_lulu': {
            currentQuestion: 2,
            correctAnswers: 1,
            completed: true
        }
    }
}
```

## 🎯 Game Flow

1. **Access**: Player opens Games menu → selects "Hinge Dating"
2. **Browse**: View profile with pixel art, bio, and traits
3. **Swipe**: Choose to Pass (👎) or Like (💖)
4. **Match**: If liked, receive +5 hearts and option to chat
5. **Conversation**: Answer 2 questions with multiple choice options
6. **Scoring**: Get feedback based on correct answers (0-100% success rate)
7. **Rewards**: Receive bonus hearts based on conversation success
8. **Repeat**: Reset profiles to see them again or chat with existing matches

## 🏆 Reward System

### Matching Rewards
- **Match**: +5 hearts immediately
- **Rondoudou Match**: Special message + 5 hearts

### Conversation Rewards
- **Correct Answer**: +2 hearts per question
- **Conversation Completion Bonus**:
  - 80%+ correct: +10 hearts ("totally smitten")
  - 50-79% correct: +5 hearts ("wants to see you again") 
  - <50% correct: +1 heart ("maybe as friends")

### Reset Options
- **Profile Reset**: See all profiles again
- **Conversation Reset**: Available via admin function

## 🎨 Visual Features

### Pixel Art Profiles
- **Canvas Size**: 160x200 pixels (bigger than original 120x150)
- **Scaling**: 6x pixel art scaling for crisp, detailed faces
- **Unique Designs**: Each Lulu variant has distinct visual features:
  - French Lulu: Navy beret with French flag colors
  - Foodie Lulu: Chef hat with pizza slice accessory
  - Travel Lulu: Backpack straps with airplane pin
  - Shopping Lulu: Shopping bags and fashionable accessories
  - Simpson Lulu: Bright yellow Simpsons-style hair
  - Rondoudou: Full pink Jigglypuff design with round body

### UI Design
- **Consistent Theming**: Matches existing game pink/purple aesthetic
- **Progressive Disclosure**: Information revealed step-by-step
- **Clear Feedback**: Visual and text feedback for all actions
- **Mobile Friendly**: Designed for touch interactions

## 🔧 Development Notes

### Adding New Profiles
1. Add profile data to `getHingeProfiles()` in main game file
2. Add conversation data to `getConversations()` in conversation-system.js
3. Create pixel art drawing function `draw[Name]Lulu()` 
4. Test all interaction flows

### Extending Conversations
- Each profile can have unlimited questions
- Add new question objects with text, options array, and correct flags
- Maintain scoring logic or customize per character

### Performance Considerations
- Conversation data loaded once and cached
- Save data updated incrementally 
- Pixel art drawn on-demand using canvas optimization
- Modal system reuses existing UI components

## 📱 User Experience

### Accessibility
- Large, clear buttons for touch interaction
- High contrast text on modal backgrounds
- Descriptive text for all actions
- Progress indicators for multi-step processes

### Error Handling
- Graceful fallback if profile data missing
- Save system recovery for incomplete conversations
- Clear messaging for all error states
- Reset options for stuck states

## 🚀 Future Enhancements

### Potential Additions
- More conversation questions per character
- Photo galleries for each profile
- Group dating scenarios
- Seasonal special characters
- Achievement system for dating success
- Integration with other game mechanics (map locations for dates)

### Technical Improvements
- Conversation branching based on previous answers
- Dynamic question generation
- Profile compatibility scoring
- Advanced pixel art animations
- Sound effects for interactions

---

*This system demonstrates modular game design with clear separation of concerns, comprehensive state management, and engaging user interactions while maintaining the whimsical charm of the original Tamagotchi experience.*