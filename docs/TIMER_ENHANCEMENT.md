# Duration Timer Enhancement for Home Hub

## Overview

This enhancement adds sophisticated timer functionality to DURATION type track attributes, providing:

- **Real-time Timer Controls**: Play, pause, and stop buttons for each duration attribute
- **Live Timer Display**: Running timers show elapsed time with visual indicators
- **State Persistence**: Timer states are saved to the database
- **Smart Duration Calculation**: Automatic calculation of duration when timers are stopped
- **Quick Entry Integration**: Running timers are displayed prominently in the quick entry panel

## Key Features Implemented

### 1. Database Schema Updates

Added timer state fields to `TrackAttributes` model:

- `timerStartTime`: When the timer was started
- `timerEndTime`: When the timer was stopped (null if running)
- `isTimerRunning`: Boolean flag indicating timer status

### 2. Timer Server Actions

Created comprehensive server actions for timer management:

- `startTimer()`: Creates new timer entry
- `stopTimer()`: Stops timer and calculates final duration
- `pauseTimer()`: Pauses timer while preserving current duration
- `resumeTimer()`: Resumes paused timer
- `getRunningTimers()`: Fetches all active timers for user

### 3. DurationTimer Component

A React component that provides:

- Real-time display of elapsed time
- Play/pause/stop controls
- Visual status indicators (green for running, yellow for paused)
- Automatic refresh every second for running timers
- Smart state management based on timer status

### 4. Enhanced UI Components

#### Attribute Tiles

- Duration tiles now show timer controls instead of just text input
- Visual timer display with status colors
- Integration with existing form submission

#### Quick Entry Panel

- Running timers section at the top of the panel
- Live timer updates
- Easy access to timer controls

#### Dialog Forms

- Smart input handling for duration types
- Option to enter manual duration or use timer controls
- Clear user guidance for timer functionality

## User Experience Flow

### Starting a Timer

1. User navigates to a track with DURATION attributes
2. Clicks the play button on any duration attribute tile
3. Timer starts immediately and shows live elapsed time
4. Green pulsing indicator shows timer is active
5. Timer appears in the Quick Entry panel for easy access

### Managing Running Timers

1. All running timers are visible in the Quick Entry panel
2. Users can pause, resume, or stop timers from any location
3. Paused timers show yellow status and preserve current duration
4. Multiple timers can run simultaneously

### Stopping and Saving

1. User clicks stop button when task is complete
2. Timer calculates final duration automatically
3. Duration is saved as a new track attribute entry
4. Timer status is cleared and ready for next use

## Technical Implementation

### Timer State Management

- Client-side state tracks current timer status
- Server-side actions ensure data persistence
- Real-time updates via React useEffect hooks
- Automatic refresh of UI components after timer actions

### Duration Calculation

- Millisecond precision timing
- Smart handling of pause/resume cycles
- Conversion to minutes for database storage
- Human-readable display formatting (HH:MM:SS)

### Error Handling

- Prevents multiple timers for same attribute
- Validates timer states before operations
- Graceful fallbacks for network errors
- User feedback via toast notifications

## Benefits

1. **Improved Accuracy**: No more manual time entry errors
2. **Better UX**: Visual feedback and easy controls
3. **Time Tracking**: Real-time monitoring of activities
4. **Flexibility**: Support for multiple concurrent timers
5. **Data Integrity**: Automatic calculation prevents human error

## Usage Examples

### Workout Tracking

- Start timer for "Cardio Session"
- See real-time duration in Quick Entry panel
- Pause for breaks, resume when continuing
- Stop when complete to save final duration

### Work Sessions

- Start timer for "Coding Sprint"
- Monitor progress across different pages
- Multiple project timers can run simultaneously
- Accurate time logging for productivity tracking

### Study Sessions

- Track individual subject study times
- Visual progress indicators keep motivation high
- Pause/resume for breaks without losing time
- Historical data shows study patterns

This enhancement transforms the duration tracking experience from manual entry to intelligent, automated timing with full user control and real-time feedback.
