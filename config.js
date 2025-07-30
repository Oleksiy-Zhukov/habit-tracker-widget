// ==== Habit Tracker Configuration ====
// This file contains all configurable settings for the habit tracker

const CONFIG = {
  // Visual settings
  visual: {
    blockSize: 12, // Increased block size
    spacing: 3,   // Adjusted spacing for grid effect
    columns: 34, // weeks
    rows: 7,     // days in a week
    totalDays: 365,
    
    // Color scheme
    colors: {
      background: "#1a1a1a", // Darker background
      completed: "#4CAF50", // Green for completed
      missed: "#FF5722",    // Orange for missed
      missedOpacity: 0.3,    // Slightly more visible missed blocks
      text: "#ffffff",
      caption: "#9e9e9e",    // Lighter gray for captions
      streak: "#FFC107",    // Amber for streak
      gridLine: "#333333"   // New grid line color
    },
    
    // Typography
    fonts: {
      title: 13, // Slightly larger title
      caption: 8,
      streak: 8 // Slightly larger streak font
    }
  },
  
  // Data storage settings
  storage: {
    historyFile: "habit_blocks.json",
    initFile: "habit_init.json",
    configFile: "habit_config.json",
    streakFile: "habit_streaks.json"
  },
  
  // Default habits configuration (can be overridden by init.js)
  habits: {
    default: {
      name: "🏋️ Gym",
      emoji: "🏋️",
      description: "Daily workout routine",
      enabled: true
    }
  },
  
  // Notification settings (for future implementation)
  notifications: {
    enabled: false,
    reminderTime: "20:00", // 8 PM
    message: "Don't forget to log your habit!"
  },
  
  // Feature flags
  features: {
    streakCounter: true,
    monthlySummary: true,
    multipleHabits: true,
    notifications: false // Limited by Scriptable capabilities
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}