// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
// ==== Habit Manager ====
// Advanced script for managing multiple habits, viewing statistics, and configuring settings

// Configuration
const CONFIG = {
  storage: {
    historyFile: "habit_blocks.json",
    configFile: "habit_config.json",
    initFile: "habit_init.json"
  }
};

// Utility functions
class ManagerUtils {
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
  
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  calculateStreaks(history, habitName) {
    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Calculate current streak (backwards from today)
    let currentDate = new Date(today);
    let maxDaysBack = 365; // Prevent infinite loops, check max 1 year back
    let daysChecked = 0;
    
    while (daysChecked < maxDaysBack) {
      const dateStr = this.formatDate(currentDate);
      
      if (history[dateStr] && history[dateStr][habitName] === true) {
        currentStreak++;
      } else {
        // If we hit a day without the habit, stop counting current streak
        break;
      }
      
      currentDate = this.addDays(currentDate, -1);
      daysChecked++;
    }
    
    // Calculate longest streak by going through all recorded dates
    const dates = Object.keys(history).sort();
    tempStreak = 0;
    
    for (const dateStr of dates) {
      if (history[dateStr] && history[dateStr][habitName] === true) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { current: currentStreak, longest: longestStreak };
  }
  
  calculateCompletionRate(history, habitName, days = 30) {
    const today = new Date();
    let completed = 0;
    let total = 0;
    
    for (let i = 0; i < days; i++) {
      const date = this.addDays(today, -i);
      if (date <= today) {
        total++;
        const dateStr = this.formatDate(date);
        if (history[dateStr] && history[dateStr][habitName] === true) {
          completed++;
        }
      }
    }
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}

// Main manager class
class HabitManager {
  constructor() {
    this.utils = new ManagerUtils();
    this.config = CONFIG;
    this.history = {};
    this.habitConfig = {};
    
    this.loadData();
  }
  
  loadData() {
    this.history = this.utils.loadJSON(this.config.storage.historyFile, {});
    this.habitConfig = this.utils.loadJSON(this.config.storage.configFile, {
      mode: "single",
      currentHabit: "🏋️ Gym",
      habits: {}
    });
  }
  
  async showMainMenu() {
    let alert = new Alert();
    alert.title = "🎯 Habit Manager";
    alert.message = "Choose an action:";
    alert.addAction("📊 View Statistics");
    alert.addAction("➕ Add New Habit");
    alert.addAction("✏️ Edit Habits");
    alert.addAction("🎨 Change Widget Habit");
    alert.addAction("🗑️ Delete Habit Data");
    alert.addAction("⚙️ Settings");
    alert.addCancelAction("Exit");
    
    return await alert.present();
  }
  
  async viewStatistics() {
    const habits = Object.keys(this.habitConfig.habits).filter(
      habitName => this.habitConfig.habits[habitName].enabled
    );
    
    if (habits.length === 0) {
      let alert = new Alert();
      alert.title = "📊 No Habits Found";
      alert.message = "No habits configured. Add some habits first!";
      alert.addAction("OK");
      await alert.present();
      return;
    }
    
    // Select habit for statistics
    let habitAlert = new Alert();
    habitAlert.title = "📊 Select Habit for Stats";
    habitAlert.message = "Choose a habit to view detailed statistics:";
    
    habits.forEach(habitName => {
      habitAlert.addAction(habitName);
    });
    
    habitAlert.addAction("📈 All Habits Summary");
    habitAlert.addCancelAction("Back");
    
    let choice = await habitAlert.present();
    if (choice === -1) return;
    
    if (choice === habits.length) {
      await this.showAllHabitsStats(habits);
    } else {
      await this.showHabitStats(habits[choice]);
    }
  }
  
  async showHabitStats(habitName) {
    const streaks = this.utils.calculateStreaks(this.history, habitName);
    const rate30 = this.utils.calculateCompletionRate(this.history, habitName, 30);
    const rate7 = this.utils.calculateCompletionRate(this.history, habitName, 7);
    
    // Calculate total completions
    let totalCompletions = 0;
    for (const dateStr in this.history) {
      if (this.history[dateStr] && this.history[dateStr][habitName] === true) {
        totalCompletions++;
      }
    }
    
    let statsMessage = `📊 Statistics for ${habitName}\n\n`;
    statsMessage += `🔥 Current Streak: ${streaks.current} days\n`;
    statsMessage += `🏆 Longest Streak: ${streaks.longest} days\n`;
    statsMessage += `📅 Last 7 days: ${rate7}%\n`;
    statsMessage += `📅 Last 30 days: ${rate30}%\n`;
    statsMessage += `✅ Total completions: ${totalCompletions}`;
    
    let alert = new Alert();
    alert.title = "📊 Habit Statistics";
    alert.message = statsMessage;
    alert.addAction("View More Stats");
    alert.addAction("Back");
    
    let choice = await alert.present();
    if (choice === 0) {
      await this.showDetailedStats(habitName);
    }
  }
  
  async showDetailedStats(habitName) {
    // Monthly breakdown for current year
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11, so add 1
    let monthlyStats = "";
    
    for (let month = 1; month <= 12; month++) {
      // Don't show future months
      if (month > currentMonth) break;
      
      const startDate = new Date(currentYear, month - 1, 1);
      const endDate = new Date(currentYear, month, 0); // Last day of the month
      const daysInMonth = endDate.getDate();
      
      let completed = 0;
      let total = 0;
      
      // Simple day-by-day iteration using day numbers
      for (let day = 1; day <= daysInMonth; day++) {
        const checkDate = new Date(currentYear, month - 1, day);
        
        // Only count days up to today (using local dates)
        if (checkDate <= today) {
          total++;
          const dateStr = this.utils.formatDate(checkDate);
          if (this.history[dateStr] && this.history[dateStr][habitName] === true) {
            completed++;
          }
        }
      }
      
      // Show all months from January up to current month
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const monthName = startDate.toLocaleDateString('en-US', { month: 'short' });
      monthlyStats += `${monthName}: ${completed}/${total} (${percentage}%)\n`;
    }
    
    let alert = new Alert();
    alert.title = `📅 ${currentYear} Monthly Breakdown`;
    alert.message = `${habitName}\n\n${monthlyStats}`;
    alert.addAction("Back");
    await alert.present();
  }
  
  async showAllHabitsStats(habits) {
    let summary = "📈 All Habits Summary\n\n";
    
    habits.forEach(habitName => {
      const streaks = this.utils.calculateStreaks(this.history, habitName);
      const rate7 = this.utils.calculateCompletionRate(this.history, habitName, 7);
      
      summary += `${habitName}\n`;
      summary += `🔥 ${streaks.current} days | 📅 ${rate7}% (7d)\n\n`;
    });
    
    let alert = new Alert();
    alert.title = "📈 All Habits Summary";
    alert.message = summary;
    alert.addAction("Back");
    await alert.present();
  }
  
  async addNewHabit() {
    let alert = new Alert();
    alert.title = "➕ Add New Habit";
    alert.message = "Enter the name for your new habit (include emoji if desired):";
    alert.addTextField("Habit Name", "🏃 Running");
    alert.addAction("Add Habit");
    alert.addCancelAction("Cancel");
    
    let result = await alert.present();
    if (result === -1) return;
    
    const habitName = alert.textFieldValue(0);
    if (!habitName || !habitName.trim()) {
      let errorAlert = new Alert();
      errorAlert.title = "❌ Invalid Name";
      errorAlert.message = "Please enter a valid habit name.";
      errorAlert.addAction("OK");
      await errorAlert.present();
      return;
    }
    
    const trimmedName = habitName.trim();
    
    if (this.habitConfig.habits[trimmedName]) {
      let errorAlert = new Alert();
      errorAlert.title = "❌ Habit Exists";
      errorAlert.message = "A habit with this name already exists.";
      errorAlert.addAction("OK");
      await errorAlert.present();
      return;
    }
    
    this.habitConfig.habits[trimmedName] = {
      name: trimmedName,
      created: new Date().toISOString(),
      enabled: true
    };
    
    // If this is the first habit, set it as current
    if (Object.keys(this.habitConfig.habits).length === 1) {
      this.habitConfig.currentHabit = trimmedName;
      this.habitConfig.mode = "single";
    } else {
      this.habitConfig.mode = "multiple";
    }
    
    const saved = this.utils.saveJSON(this.config.storage.configFile, this.habitConfig);
    
    let confirmAlert = new Alert();
    confirmAlert.title = saved ? "✅ Habit Added" : "❌ Save Error";
    confirmAlert.message = saved ? 
      `${trimmedName} has been added to your habits!` : 
      "Failed to save the new habit. Please try again.";
    confirmAlert.addAction("OK");
    await confirmAlert.present();
  }
  
  async editHabits() {
    const habits = Object.keys(this.habitConfig.habits);
    
    if (habits.length === 0) {
      let alert = new Alert();
      alert.title = "✏️ No Habits to Edit";
      alert.message = "No habits found. Add some habits first!";
      alert.addAction("OK");
      await alert.present();
      return;
    }
    
    let alert = new Alert();
    alert.title = "✏️ Edit Habits";
    alert.message = "Select a habit to edit:";
    
    habits.forEach(habitName => {
      const enabled = this.habitConfig.habits[habitName].enabled;
      alert.addAction(`${habitName} ${enabled ? '✅' : '❌'}`);
    });
    
    alert.addCancelAction("Back");
    
    let choice = await alert.present();
    if (choice === -1) return;
    
    await this.editSpecificHabit(habits[choice]);
  }
  
  async editSpecificHabit(habitName) {
    const habit = this.habitConfig.habits[habitName];
    
    let alert = new Alert();
    alert.title = "✏️ Edit Habit";
    alert.message = `Editing: ${habitName}`;
    alert.addAction(habit.enabled ? "Disable" : "Enable");
    alert.addAction("Rename");
    alert.addAction("Delete");
    alert.addCancelAction("Back");
    
    let choice = await alert.present();
    if (choice === -1) return;
    
    switch (choice) {
      case 0: // Toggle enabled
        habit.enabled = !habit.enabled;
        this.utils.saveJSON(this.config.storage.configFile, this.habitConfig);
        
        let toggleAlert = new Alert();
        toggleAlert.title = "✅ Updated";
        toggleAlert.message = `${habitName} is now ${habit.enabled ? 'enabled' : 'disabled'}.`;
        toggleAlert.addAction("OK");
        await toggleAlert.present();
        break;
        
      case 1: // Rename
        await this.renameHabit(habitName);
        break;
        
      case 2: // Delete
        await this.deleteHabit(habitName);
        break;
    }
  }
  
  async renameHabit(oldName) {
    let alert = new Alert();
    alert.title = "✏️ Rename Habit";
    alert.message = `Current name: ${oldName}`;
    alert.addTextField("New Name", oldName);
    alert.addAction("Rename");
    alert.addCancelAction("Cancel");
    
    let result = await alert.present();
    if (result === -1) return;
    
    const newName = alert.textFieldValue(0);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    
    const trimmedNewName = newName.trim();
    
    if (this.habitConfig.habits[trimmedNewName]) {
      let errorAlert = new Alert();
      errorAlert.title = "❌ Name Exists";
      errorAlert.message = "A habit with this name already exists.";
      errorAlert.addAction("OK");
      await errorAlert.present();
      return;
    }
    
    // Update habit config
    this.habitConfig.habits[trimmedNewName] = this.habitConfig.habits[oldName];
    this.habitConfig.habits[trimmedNewName].name = trimmedNewName;
    delete this.habitConfig.habits[oldName];
    
    // Update current habit if needed
    if (this.habitConfig.currentHabit === oldName) {
      this.habitConfig.currentHabit = trimmedNewName;
    }
    
    // Update history
    for (const dateStr in this.history) {
      if (this.history[dateStr] && this.history[dateStr][oldName] !== undefined) {
        this.history[dateStr][trimmedNewName] = this.history[dateStr][oldName];
        delete this.history[dateStr][oldName];
      }
    }
    
    // Save both files
    const configSaved = this.utils.saveJSON(this.config.storage.configFile, this.habitConfig);
    const historySaved = this.utils.saveJSON(this.config.storage.historyFile, this.history);
    
    let confirmAlert = new Alert();
    confirmAlert.title = (configSaved && historySaved) ? "✅ Renamed" : "❌ Error";
    confirmAlert.message = (configSaved && historySaved) ? 
      `Habit renamed to: ${trimmedNewName}` : 
      "Failed to rename habit. Please try again.";
    confirmAlert.addAction("OK");
    await confirmAlert.present();
  }
  
  async deleteHabit(habitName) {
    let confirmAlert = new Alert();
    confirmAlert.title = "🗑️ Delete Habit";
    confirmAlert.message = `Are you sure you want to delete "${habitName}"? This will remove all historical data for this habit.`;
    confirmAlert.addAction("Delete");
    confirmAlert.addCancelAction("Cancel");
    
    let result = await confirmAlert.present();
    if (result === -1) return;
    
    // Remove from config
    delete this.habitConfig.habits[habitName];
    
    // Update current habit if needed
    const remainingHabits = Object.keys(this.habitConfig.habits);
    if (this.habitConfig.currentHabit === habitName) {
      this.habitConfig.currentHabit = remainingHabits.length > 0 ? remainingHabits[0] : "";
    }
    
    // Update mode
    this.habitConfig.mode = remainingHabits.length <= 1 ? "single" : "multiple";
    
    // Remove from history
    for (const dateStr in this.history) {
      if (this.history[dateStr] && this.history[dateStr][habitName] !== undefined) {
        delete this.history[dateStr][habitName];
        
        // Remove empty date entries
        if (Object.keys(this.history[dateStr]).length === 0) {
          delete this.history[dateStr];
        }
      }
    }
    
    // Save both files
    const configSaved = this.utils.saveJSON(this.config.storage.configFile, this.habitConfig);
    const historySaved = this.utils.saveJSON(this.config.storage.historyFile, this.history);
    
    let resultAlert = new Alert();
    resultAlert.title = (configSaved && historySaved) ? "✅ Deleted" : "❌ Error";
    resultAlert.message = (configSaved && historySaved) ? 
      `${habitName} has been deleted.` : 
      "Failed to delete habit. Please try again.";
    resultAlert.addAction("OK");
    await resultAlert.present();
  }
  
  async changeWidgetHabit() {
    const habits = Object.keys(this.habitConfig.habits).filter(
      habitName => this.habitConfig.habits[habitName].enabled
    );
    
    if (habits.length === 0) {
      let alert = new Alert();
      alert.title = "🎨 No Habits Available";
      alert.message = "No enabled habits found.";
      alert.addAction("OK");
      await alert.present();
      return;
    }
    
    let alert = new Alert();
    alert.title = "🎨 Change Widget Habit";
    alert.message = `Current: ${this.habitConfig.currentHabit}\n\nSelect new habit for widget:`;
    
    habits.forEach(habitName => {
      const isCurrent = habitName === this.habitConfig.currentHabit;
      alert.addAction(`${habitName} ${isCurrent ? '(current)' : ''}`);
    });
    
    alert.addCancelAction("Cancel");
    
    let choice = await alert.present();
    if (choice === -1) return;
    
    const selectedHabit = habits[choice];
    this.habitConfig.currentHabit = selectedHabit;
    
    const saved = this.utils.saveJSON(this.config.storage.configFile, this.habitConfig);
    
    let confirmAlert = new Alert();
    confirmAlert.title = saved ? "✅ Widget Updated" : "❌ Save Error";
    confirmAlert.message = saved ? 
      `Widget will now show: ${selectedHabit}` : 
      "Failed to update widget habit.";
    confirmAlert.addAction("OK");
    await confirmAlert.present();
  }
  
  async deleteAllData() {
    let confirmAlert = new Alert();
    confirmAlert.title = "🗑️ Delete All Data";
    confirmAlert.message = "This will delete ALL habit data and cannot be undone. Are you absolutely sure?";
    confirmAlert.addAction("Delete Everything");
    confirmAlert.addCancelAction("Cancel");
    
    let result = await confirmAlert.present();
    if (result === -1) return;
    
    // Double confirmation
    let doubleConfirm = new Alert();
    doubleConfirm.title = "⚠️ Final Warning";
    doubleConfirm.message = "This action cannot be undone. Type 'DELETE' to confirm:";
    doubleConfirm.addTextField("Confirmation", "");
    doubleConfirm.addAction("Confirm");
    doubleConfirm.addCancelAction("Cancel");
    
    let finalResult = await doubleConfirm.present();
    if (finalResult === -1) return;
    
    const confirmation = doubleConfirm.textFieldValue(0);
    if (confirmation !== "DELETE") {
      let errorAlert = new Alert();
      errorAlert.title = "❌ Confirmation Failed";
      errorAlert.message = "Deletion cancelled - confirmation text did not match.";
      errorAlert.addAction("OK");
      await errorAlert.present();
      return;
    }
    
    // Delete all files
    const files = [
      this.config.storage.historyFile,
      this.config.storage.configFile,
      this.config.storage.initFile
    ];
    
    let deletedCount = 0;
    files.forEach(filename => {
      const filePath = this.utils.getFilePath(filename);
      if (this.utils.fileManager.fileExists(filePath)) {
        try {
          this.utils.fileManager.remove(filePath);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete ${filename}:`, error);
        }
      }
    });
    
    let resultAlert = new Alert();
    resultAlert.title = "🗑️ Data Deleted";
    resultAlert.message = `${deletedCount} files deleted. Run the setup script to start fresh.`;
    resultAlert.addAction("OK");
    await resultAlert.present();
  }
  
  async showSettings() {
    let alert = new Alert();
    alert.title = "⚙️ Settings";
    alert.message = "Configuration options:";
    alert.addAction("📱 Widget Settings");
    alert.addAction("📊 Export Data");
    alert.addAction("🔄 Reset to Defaults");
    alert.addCancelAction("Back");
    
    let choice = await alert.present();
    
    switch (choice) {
      case 0:
        await this.widgetSettings();
        break;
      case 1:
        await this.exportData();
        break;
      case 2:
        await this.resetToDefaults();
        break;
    }
  }
  
  async widgetSettings() {
    let alert = new Alert();
    alert.title = "📱 Widget Settings";
    alert.message = "Widget configuration options:";
    alert.addAction("🎨 Change Widget Habit");
    alert.addAction("📏 Widget Size Info");
    alert.addCancelAction("Back");
    
    let choice = await alert.present();
    
    if (choice === 0) {
      await this.changeWidgetHabit();
    } else if (choice === 1) {
      let infoAlert = new Alert();
      infoAlert.title = "📏 Widget Size Info";
      infoAlert.message = "This widget is designed for Large size (4x2 grid).\n\nTo set up:\n1. Long-press home screen\n2. Tap '+' to add widget\n3. Find Scriptable\n4. Choose Large size\n5. Select habit-widget.js script";
      infoAlert.addAction("OK");
      await infoAlert.present();
    }
  }
  
  async exportData() {
    const exportData = {
      history: this.history,
      config: this.habitConfig,
      exportDate: new Date().toISOString(),
      version: "2.0"
    };
    
    let alert = new Alert();
    alert.title = "📊 Export Data";
    alert.message = "Data exported to console. Check Scriptable logs to copy the JSON data.";
    alert.addAction("OK");
    
    console.log("=== HABIT TRACKER EXPORT ===");
    console.log(JSON.stringify(exportData, null, 2));
    console.log("=== END EXPORT ===");
    
    await alert.present();
  }
  
  async resetToDefaults() {
    let confirmAlert = new Alert();
    confirmAlert.title = "🔄 Reset to Defaults";
    confirmAlert.message = "This will reset all settings to defaults but keep your habit data. Continue?";
    confirmAlert.addAction("Reset Settings");
    confirmAlert.addCancelAction("Cancel");
    
    let result = await confirmAlert.present();
    if (result === -1) return;
    
    // Reset config to defaults while preserving habits
    const defaultConfig = {
      mode: Object.keys(this.habitConfig.habits).length <= 1 ? "single" : "multiple",
      currentHabit: Object.keys(this.habitConfig.habits)[0] || "🏋️ Gym",
      habits: this.habitConfig.habits,
      version: "2.0"
    };
    
    const saved = this.utils.saveJSON(this.config.storage.configFile, defaultConfig);
    
    let resultAlert = new Alert();
    resultAlert.title = saved ? "✅ Reset Complete" : "❌ Reset Failed";
    resultAlert.message = saved ? 
      "Settings have been reset to defaults." : 
      "Failed to reset settings.";
    resultAlert.addAction("OK");
    await resultAlert.present();
  }
  
  async run() {
    try {
      while (true) {
        const choice = await this.showMainMenu();
        
        if (choice === -1) break; // Exit
        
        switch (choice) {
          case 0:
            await this.viewStatistics();
            break;
          case 1:
            await this.addNewHabit();
            break;
          case 2:
            await this.editHabits();
            break;
          case 3:
            await this.changeWidgetHabit();
            break;
          case 4:
            await this.deleteAllData();
            break;
          case 5:
            await this.showSettings();
            break;
        }
        
        // Reload data after any changes
        this.loadData();
      }
      
    } catch (error) {
      console.error("Manager error:", error);
      
      let errorAlert = new Alert();
      errorAlert.title = "❌ Manager Error";
      errorAlert.message = "An error occurred in the habit manager. Please try again.";
      errorAlert.addAction("OK");
      await errorAlert.present();
    }
  }
}

// Run the manager
const manager = new HabitManager();
await manager.run();