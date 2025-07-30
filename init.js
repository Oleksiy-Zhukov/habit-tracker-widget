// ==== Enhanced Habit Tracker Initialization (TIMEZONE FIXED VERSION) ====
// Setup script for configuring the habit tracker with multiple options

// Configuration
const CONFIG = {
  storage: {
    historyFile: "habit_blocks.json",
    initFile: "habit_init.json",
    configFile: "habit_config.json"
  }
};

// Utility functions
class InitUtils {
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
    // Use local timezone instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  formatDateTimeForStorage(date) {
    // For timestamps, we can use ISO but should be consistent
    return date.toISOString();
  }
}

// Main initialization class
class HabitTrackerInit {
  constructor() {
    this.utils = new InitUtils();
    this.config = CONFIG;
  }
  
  async setupStartDate() {
    let alert = new Alert();
    alert.title = "🗓️ Start Tracking From...";
    alert.message = "Choose when your habit tracking journey begins.";
    alert.addAction("Today");
    alert.addAction("Beginning of Year");
    alert.addAction("Beginning of Month");
    alert.addAction("Custom Date");
    alert.addCancelAction("Cancel");
    
    let choice = await alert.present();
    if (choice === -1) return false;
    
    let startDate;
    
    switch (choice) {
      case 0: // Today
        startDate = new Date();
        break;
        
      case 1: // Beginning of Year
        startDate = new Date(new Date().getFullYear(), 0, 1);
        break;
        
      case 2: // Beginning of Month
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
        
      case 3: // Custom Date
        startDate = await this.getCustomDate();
        if (!startDate) return false;
        break;
        
      default:
        return false;
    }
    
    const initData = {
      start: this.utils.formatDateTimeForStorage(startDate),
      setupDate: this.utils.formatDateTimeForStorage(new Date()),
      version: "2.0"
    };
    
    const success = this.utils.saveJSON(this.config.storage.initFile, initData);
    
    if (success) {
      let successAlert = new Alert();
      successAlert.title = "✅ Setup Complete";
      successAlert.message = `Start date set to: ${startDate.toLocaleDateString()}`;
      successAlert.addAction("OK");
      await successAlert.present();
    }
    
    return success;
  }
  
  async getCustomDate() {
    let dateAlert = new Alert();
    dateAlert.title = "📅 Custom Start Date";
    dateAlert.message = "Enter the start date (YYYY-MM-DD format):";
    dateAlert.addTextField("YYYY-MM-DD", this.utils.formatDate(new Date()));
    dateAlert.addAction("Set Date");
    dateAlert.addCancelAction("Cancel");
    
    let result = await dateAlert.present();
    if (result === -1) return null;
    
    const dateString = dateAlert.textFieldValue(0);
    const date = new Date(dateString + 'T00:00:00'); // Force local timezone
    
    if (isNaN(date.getTime())) {
      let errorAlert = new Alert();
      errorAlert.title = "❌ Invalid Date";
      errorAlert.message = "Please enter a valid date in YYYY-MM-DD format.";
      errorAlert.addAction("OK");
      await errorAlert.present();
      return null;
    }
    
    return date;
  }
  
  async setupHabits() {
    let alert = new Alert();
    alert.title = "🎯 Habit Configuration";
    alert.message = "Configure your habit tracking preferences.";
    alert.addAction("Single Habit (Simple)");
    alert.addAction("Multiple Habits (Advanced)");
    alert.addCancelAction("Skip");
    
    let choice = await alert.present();
    if (choice === -1) return true; // Skip is OK
    
    if (choice === 0) {
      return await this.setupSingleHabit();
    } else {
      return await this.setupMultipleHabits();
    }
  }
  
  async setupSingleHabit() {
    let habitAlert = new Alert();
    habitAlert.title = "🏃 Single Habit Setup";
    habitAlert.message = "Enter your habit name (include emoji if desired):";
    habitAlert.addTextField("Habit Name", "🏋️ Gym");
    habitAlert.addAction("Save");
    habitAlert.addCancelAction("Cancel");
    
    let result = await habitAlert.present();
    if (result === -1) return false;
    
    const habitName = habitAlert.textFieldValue(0) || "🏋️ Gym";
    
    const habitConfig = {
      mode: "single",
      currentHabit: habitName,
      habits: {
        [habitName]: {
          name: habitName,
          created: this.utils.formatDateTimeForStorage(new Date()),
          enabled: true
        }
      },
      version: "2.0"
    };
    
    return this.utils.saveJSON(this.config.storage.configFile, habitConfig);
  }
  
  async setupMultipleHabits() {
    const habits = {};
    let habitCount = 0;
    
    while (habitCount < 5) { // Limit to 5 habits for widget space
      let habitAlert = new Alert();
      habitAlert.title = `🎯 Habit ${habitCount + 1}`;
      habitAlert.message = habitCount === 0 ? 
        "Enter your first habit name:" : 
        "Enter another habit name (or cancel to finish):";
      habitAlert.addTextField("Habit Name", habitCount === 0 ? "🏋️ Gym" : "");
      habitAlert.addAction("Add Habit");
      if (habitCount > 0) habitAlert.addCancelAction("Finish");
      
      let result = await habitAlert.present();
      if (result === -1 && habitCount > 0) break; // Finish
      if (result === -1 && habitCount === 0) return false; // Cancel
      
      const habitName = habitAlert.textFieldValue(0);
      if (habitName && habitName.trim()) {
        habits[habitName.trim()] = {
          name: habitName.trim(),
          created: this.utils.formatDateTimeForStorage(new Date()),
          enabled: true
        };
        habitCount++;
      }
    }
    
    if (Object.keys(habits).length === 0) return false;
    
    const habitConfig = {
      mode: "multiple",
      currentHabit: Object.keys(habits)[0], // Default to first habit
      habits: habits,
      version: "2.0"
    };
    
    return this.utils.saveJSON(this.config.storage.configFile, habitConfig);
  }
  
  // NEW METHOD: Initialize the habit blocks file
  async initializeHabitBlocks() {
    // Load the habit configuration to determine format
    const habitConfig = this.utils.loadJSON(this.config.storage.configFile, {});
    
    // Check if habit_blocks.json already exists
    const existingHistory = this.utils.loadJSON(this.config.storage.historyFile, null);
    
    if (existingHistory !== null) {
      // File exists, don't overwrite
      console.log("habit_blocks.json already exists, keeping existing data");
      return true;
    }
    
    // Create empty history file in the correct format
    let initialHistory = {};
    
    // For new installations, start with empty object
    // The format will be determined when first habit is logged:
    // - Single habit mode: { "2024-01-01": true/false }
    // - Multiple habit mode: { "2024-01-01": { "🏋️ Gym": true, "📚 Read": false } }
    
    const success = this.utils.saveJSON(this.config.storage.historyFile, initialHistory);
    
    if (success) {
      console.log("Created empty habit_blocks.json file");
    } else {
      console.error("Failed to create habit_blocks.json file");
    }
    
    return success;
  }
  
  async migrateOldData() {
    // Check if old data exists and needs migration
    const oldHistory = this.utils.loadJSON(this.config.storage.historyFile, {});
    
    if (Object.keys(oldHistory).length === 0) return true;
    
    // Check if data is already in new format
    const firstEntry = Object.values(oldHistory)[0];
    if (typeof firstEntry === 'object' && firstEntry !== null) {
      return true; // Already migrated
    }
    
    let migrateAlert = new Alert();
    migrateAlert.title = "🔄 Data Migration";
    migrateAlert.message = "Old habit data detected. Migrate to new format?";
    migrateAlert.addAction("Migrate");
    migrateAlert.addAction("Start Fresh");
    migrateAlert.addCancelAction("Cancel");
    
    let choice = await migrateAlert.present();
    if (choice === -1) return false;
    
    if (choice === 1) {
      // Start fresh - clear old data
      this.utils.saveJSON(this.config.storage.historyFile, {});
      return true;
    }
    
    // Migrate old data
    const habitConfig = this.utils.loadJSON(this.config.storage.configFile, {});
    const defaultHabitName = habitConfig.currentHabit || "🏋️ Gym";
    
    const migratedHistory = {};
    for (const dateStr in oldHistory) {
      const entry = oldHistory[dateStr];
      if (typeof entry === 'boolean') {
        migratedHistory[dateStr] = {
          [defaultHabitName]: entry
        };
      }
    }
    
    return this.utils.saveJSON(this.config.storage.historyFile, migratedHistory);
  }
  
  async run() {
    try {
      let welcomeAlert = new Alert();
      welcomeAlert.title = "🎯 Habit Tracker Setup";
      welcomeAlert.message = "Welcome! Let's set up your habit tracking system.";
      welcomeAlert.addAction("Continue");
      welcomeAlert.addCancelAction("Cancel");
      
      let proceed = await welcomeAlert.present();
      if (proceed === -1) return;
      
      // Step 1: Migrate old data if needed
      console.log("Checking for data migration...");
      const migrated = await this.migrateOldData();
      if (!migrated) return;
      
      // Step 2: Setup start date
      console.log("Setting up start date...");
      const dateSetup = await this.setupStartDate();
      if (!dateSetup) return;
      
      // Step 3: Setup habits
      console.log("Setting up habits...");
      const habitSetup = await this.setupHabits();
      if (!habitSetup) return;
      
      // Step 4: Initialize habit blocks file (NEW STEP)
      console.log("Initializing habit tracking file...");
      const blocksInit = await this.initializeHabitBlocks();
      if (!blocksInit) {
        let errorAlert = new Alert();
        errorAlert.title = "⚠️ Warning";
        errorAlert.message = "Could not create habit tracking file. You may need to manually create it.";
        errorAlert.addAction("Continue Anyway");
        await errorAlert.present();
      }
      
      // Final success message
      let finalAlert = new Alert();
      finalAlert.title = "🎉 Setup Complete!";
      finalAlert.message = "Your habit tracker is ready to use. Add the widget to your home screen and start logging your habits!";
      finalAlert.addAction("Great!");
      await finalAlert.present();
      
    } catch (error) {
      console.error("Setup error:", error);
      
      let errorAlert = new Alert();
      errorAlert.title = "❌ Setup Error";
      errorAlert.message = `An error occurred during setup: ${error.message}. Please try again.`;
      errorAlert.addAction("OK");
      await errorAlert.present();
    }
  }
}

// Run the initialization
const init = new HabitTrackerInit();
await init.run();