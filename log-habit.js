// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;
// ==== Enhanced Habit Logger ====
// Interactive script for logging daily habit completion with multi-habit support

// Configuration
const CONFIG = {
  storage: {
    historyFile: "habit_blocks.json",
    configFile: "habit_config.json"
  }
};

// Utility functions
class LoggerUtils {
  constructor(fileManager = FileManager.iCloud()) {
    this.fileManager = fileManager;
    this.documentsPath = fileManager.documentsDirectory();
  }
  
  getFilePath(filename) {
    return this.fileManager.joinPath(this.documentsPath, filename);
  }
  
  loadJSON(filename, defaultValue = {}) {
    const filePath = this.getFilePath(filename);
    if (this.fileManager.fileExists(filePath)) {
      try {
        const content = this.fileManager.readString(filePath);
        return JSON.parse(content);
      } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return defaultValue;
      }
    }
    return defaultValue;
  }
  
  saveJSON(filename, data) {
    const filePath = this.getFilePath(filename);
    try {
      this.fileManager.writeString(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
      return false;
    }
  }
  
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
    
  }
  
  calculateStreak(history, habitName) {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (currentDate >= new Date(today.getFullYear(), 0, 1)) {
      const dateStr = this.formatDate(currentDate);
      
      if (history[dateStr] && history[dateStr][habitName] === true) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }
}

// Main logger class
class HabitLogger {
  constructor() {
    this.utils = new LoggerUtils();
    this.config = CONFIG;
    this.history = {};
    this.habitConfig = {};
    this.today = this.utils.formatDate(new Date());
    
    this.loadData();
  }
  
  loadData() {
    // Load habit history
    this.history = this.utils.loadJSON(this.config.storage.historyFile, {});
    
    // Load habit configuration
    this.habitConfig = this.utils.loadJSON(this.config.storage.configFile, {
      mode: "single",
      currentHabit: "🏋️ Gym",
      habits: {
        "🏋️ Gym": {
          name: "🏋️ Gym",
          enabled: true
        }
      }
    });
    
    // Ensure today's entry exists
    if (!this.history[this.today]) {
      this.history[this.today] = {};
    }
  }
  
  async logSingleHabit() {
    const habitName = this.habitConfig.currentHabit;
    const currentStatus = this.history[this.today][habitName] || false;
    
    let alert = new Alert();
    alert.title = "📝 Log Today's Habit";
    alert.message = `Habit: ${habitName}\nCurrent status: ${currentStatus ? '✅ Completed' : '❌ Not completed'}`;
    
    if (currentStatus) {
      alert.addAction("Mark as Not Done ❌");
      alert.addAction("Keep as Done ✅");
    } else {
      alert.addAction("Mark as Done ✅");
      alert.addAction("Keep as Not Done ❌");
    }
    
    alert.addCancelAction("Cancel");
    
    let choice = await alert.present();
    if (choice === -1) return false;
    
    let newStatus;
    if (currentStatus) {
      newStatus = choice === 1; // Keep as done = true, mark as not done = false
    } else {
      newStatus = choice === 0; // Mark as done = true, keep as not done = false
    }
    
    this.history[this.today][habitName] = newStatus;
    
    // Show confirmation with streak info
    const streak = this.utils.calculateStreak(this.history, habitName);
    
    let confirmAlert = new Alert();
    confirmAlert.title = newStatus ? "✅ Habit Completed!" : "❌ Habit Marked Incomplete";
    confirmAlert.message = `${habitName}\n🔥 Current streak: ${streak} days`;
    confirmAlert.addAction("Great!");
    await confirmAlert.present();
    
    return true;
  }
  
  async logMultipleHabits() {
    const habits = Object.keys(this.habitConfig.habits).filter(
      habitName => this.habitConfig.habits[habitName].enabled
    );
    
    if (habits.length === 0) {
      let errorAlert = new Alert();
      errorAlert.title = "❌ No Habits Found";
      errorAlert.message = "No enabled habits found. Please run the setup script first.";
      errorAlert.addAction("OK");
      await errorAlert.present();
      return false;
    }
    
    // Show habit selection menu
    let habitAlert = new Alert();
    habitAlert.title = "🎯 Select Habit to Log";
    habitAlert.message = "Choose which habit you want to update:";
    
    habits.forEach(habitName => {
      const status = this.history[this.today][habitName] || false;
      habitAlert.addAction(`${habitName} ${status ? '✅' : '❌'}`);
    });
    
    habitAlert.addAction("📊 View All Status");
    habitAlert.addCancelAction("Cancel");
    
    let choice = await habitAlert.present();
    if (choice === -1) return false;
    
    if (choice === habits.length) {
      // View all status
      return await this.showAllHabitsStatus(habits);
    }
    
    // Log specific habit
    const selectedHabit = habits[choice];
    return await this.logSpecificHabit(selectedHabit);
  }
  
  async logSpecificHabit(habitName) {
    const currentStatus = this.history[this.today][habitName] || false;
    
    let alert = new Alert();
    alert.title = "📝 Update Habit";
    alert.message = `${habitName}\nCurrent: ${currentStatus ? '✅ Done' : '❌ Not done'}`;
    
    alert.addAction(currentStatus ? "Mark as Not Done ❌" : "Mark as Done ✅");
    alert.addAction("Keep Current Status");
    alert.addCancelAction("Back");
    
    let choice = await alert.present();
    if (choice === -1) return await this.logMultipleHabits(); // Go back
    if (choice === 1) return true; // Keep current status
    
    // Toggle status
    const newStatus = !currentStatus;
    this.history[this.today][habitName] = newStatus;
    
    // Show confirmation
    const streak = this.utils.calculateStreak(this.history, habitName);
    
    let confirmAlert = new Alert();
    confirmAlert.title = newStatus ? "✅ Habit Completed!" : "❌ Habit Marked Incomplete";
    confirmAlert.message = `${habitName}\n🔥 Current streak: ${streak} days`;
    confirmAlert.addAction("Continue Logging");
    confirmAlert.addAction("Finish");
    
    let continueChoice = await confirmAlert.present();
    
    if (continueChoice === 0) {
      return await this.logMultipleHabits(); // Continue with other habits
    }
    
    return true;
  }
  
  async showAllHabitsStatus(habits) {
    let statusMessage = "Today's Status:\n\n";
    
    habits.forEach(habitName => {
      const status = this.history[this.today][habitName] || false;
      const streak = this.utils.calculateStreak(this.history, habitName);
      statusMessage += `${habitName}\n${status ? '✅' : '❌'} | 🔥 ${streak} days\n\n`;
    });
    
    let statusAlert = new Alert();
    statusAlert.title = "📊 All Habits Status";
    statusAlert.message = statusMessage;
    statusAlert.addAction("Update a Habit");
    statusAlert.addAction("Finish");
    
    let choice = await statusAlert.present();
    
    if (choice === 0) {
      return await this.logMultipleHabits();
    }
    
    return true;
  }
  
  async run() {
    try {
      // Determine logging mode
      const isMultipleMode = this.habitConfig.mode === "multiple" && 
                            Object.keys(this.habitConfig.habits).length > 1;
      
      let success;
      if (isMultipleMode) {
        success = await this.logMultipleHabits();
      } else {
        success = await this.logSingleHabit();
      }
      
      if (success) {
        // Save the updated history
        const saved = this.utils.saveJSON(this.config.storage.historyFile, this.history);
        
        if (!saved) {
          let errorAlert = new Alert();
          errorAlert.title = "❌ Save Error";
          errorAlert.message = "Failed to save habit data. Please try again.";
          errorAlert.addAction("OK");
          await errorAlert.present();
        }
      }
      
    } catch (error) {
      console.error("Logging error:", error);
      
      let errorAlert = new Alert();
      errorAlert.title = "❌ Logging Error";
      errorAlert.message = "An error occurred while logging your habit. Please try again.";
      errorAlert.addAction("OK");
      await errorAlert.present();
    }
  }
}

// Run the logger
const logger = new HabitLogger();
await logger.run();
