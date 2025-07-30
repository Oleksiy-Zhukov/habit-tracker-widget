// ==== Enhanced Habit Tracker Widget (FIXED VERSION) ====
// A polished iOS widget for tracking daily habits with enhanced visuals and multi-habit support
// Supports widget parameters to display different habits on different widgets

// Configuration
const CONFIG = {
  visual: {
    blockSize: 12,
    spacing: 3,
    columns: 32,
    rows: 7,
    totalDays: 365,
    colors: {
      background: "#1a1a1a",
      completed: "#4CAF50",
      missed: "#FF5722",
      missedOpacity: 0.15,
      text: "#ffffff",
      caption: "#9e9e9e",
      streak: "#FFC107",
      gridLine: "#333333"
    },
    fonts: {
      title: 13,
      caption: 8,
      streak: 8
    }
  },
  storage: {
    historyFile: "habit_blocks.json",
    initFile: "habit_init.json",
    configFile: "habit_config.json"
  },
  features: {
    streakCounter: true,
    monthlySummary: false,
    multipleHabits: true
  }
};

// Utility class (simplified version)
class HabitUtils {
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
  
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  calculateCurrentStreak(history, habitName = null) {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    const getCompletionStatus = (dateStr) => {
      if (habitName && history[dateStr] && typeof history[dateStr] === 'object') {
        return history[dateStr][habitName] === true;
      }
      return history[dateStr] === true;
    };
    
    while (currentDate >= new Date(today.getFullYear(), 0, 1)) {
      const dateStr = this.formatDate(currentDate);
      
      if (getCompletionStatus(dateStr)) {
        streak++;
      } else {
        break;
      }
      
      currentDate = this.addDays(currentDate, -1);
    }
    
    return streak;
  }
  
  getMonthlySummary(history, year, month, habitName = null) {
  const today = new Date();
  const isThisMonth = (today.getFullYear() === year && today.getMonth() === (month - 1));
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Get all log dates this month
  const monthLogs = Object.keys(history)
    .filter(dateStr => {
      const date = new Date(dateStr);
      return (
        date.getFullYear() === year &&
        date.getMonth() === (month - 1) &&
        (!habitName || history[dateStr][habitName] !== undefined)
      );
    })
    .sort();

  if (monthLogs.length === 0) {
    return {
      completed: 0,
      total: 0,
      percentage: 0,
      month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }

  const firstLogDate = new Date(monthLogs[0]);

  let completed = 0;
  let total = 0;

  for (
    let date = new Date(firstLogDate);
    date <= today && date <= endDate;
    date.setDate(date.getDate() + 1)
  ) {
    total++;
    const dateStr = this.formatDate(date);
    if (
      (habitName && history[dateStr]?.[habitName] === true) ||
      (!habitName && history[dateStr] === true)
    ) {
      completed++;
    }
  }

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
  
}
}

// Main widget class
class HabitTrackerWidget {
  constructor() {
    this.utils = new HabitUtils();
    this.config = CONFIG;
    this.history = {};
    this.initDate = new Date();
    this.currentHabit = null;
    this.habitConfig = {};
    this.setupComplete = false;
    
    this.loadData();
    this.determineHabitFromParameter();
  }
  
  loadData() {
    try {
      // Load habit history
      this.history = this.utils.loadJSON(this.config.storage.historyFile, {});
      console.log(`Loaded history with ${Object.keys(this.history).length} entries`);
      
      // Load initialization date
      const initData = this.utils.loadJSON(this.config.storage.initFile, {});
      if (initData.start) {
        this.initDate = new Date(initData.start);
        this.setupComplete = true;
        console.log(`Loaded init date: ${this.initDate.toISOString()}`);
      } else {
        console.log("No initialization data found - setup may be incomplete");
        // Set a fallback date to prevent errors
        this.initDate = new Date(new Date().getFullYear(), 0, 1); // Beginning of current year
        this.setupComplete = false;
      }
      
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
      
      // Validate that configuration has required properties
      if (!this.habitConfig.habits || Object.keys(this.habitConfig.habits).length === 0) {
        console.log("Invalid habit configuration - using default");
        this.habitConfig = {
          mode: "single",
          currentHabit: "🏋️ Gym",
          habits: {
            "🏋️ Gym": {
              name: "🏋️ Gym",
              enabled: true
            }
          }
        };
        this.setupComplete = false;
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      this.setupComplete = false;
      // Set fallback values to prevent crashes
      this.initDate = new Date(new Date().getFullYear(), 0, 1);
      this.history = {};
      this.habitConfig = {
        mode: "single",
        currentHabit: "🏋️ Gym",
        habits: {
          "🏋️ Gym": {
            name: "🏋️ Gym",
            enabled: true
          }
        }
      };
    }
  }
  
  determineHabitFromParameter() {
    try {
      // Ensure we have valid habit configuration
      if (!this.habitConfig.habits || Object.keys(this.habitConfig.habits).length === 0) {
        console.log("No habits configured, using default");
        this.currentHabit = "🏋️ Gym";
        return;
      }
      
      // Get list of enabled habits
      const enabledHabits = Object.keys(this.habitConfig.habits).filter(
        name => this.habitConfig.habits[name] && this.habitConfig.habits[name].enabled !== false
      );
      
      if (enabledHabits.length === 0) {
        console.log("No enabled habits found, using first available");
        this.currentHabit = Object.keys(this.habitConfig.habits)[0] || "🏋️ Gym";
        return;
      }
      
      // Get widget parameter - handle both string and potential undefined
      let widgetParameter = null;
      try {
        widgetParameter = args.widgetParameter;
      } catch (e) {
        console.log("Widget parameter not available:", e);
      }
      
      if (widgetParameter) {
        console.log(`Widget parameter received: ${widgetParameter}`);
        
        // Try to parse as number first
        const paramNumber = parseInt(widgetParameter.toString());
        if (!isNaN(paramNumber) && paramNumber >= 1 && paramNumber <= enabledHabits.length) {
          this.currentHabit = enabledHabits[paramNumber - 1];
          console.log(`Using habit by index ${paramNumber}: ${this.currentHabit}`);
          return;
        }
        
        // Try as exact habit name match
        if (enabledHabits.includes(widgetParameter.toString())) {
          this.currentHabit = widgetParameter.toString();
          console.log(`Using habit by name: ${this.currentHabit}`);
          return;
        }
        
        console.log(`Parameter "${widgetParameter}" not found, using default`);
      }
      
      // Fallback to configured current habit or first enabled habit
      if (this.habitConfig.currentHabit && enabledHabits.includes(this.habitConfig.currentHabit)) {
        this.currentHabit = this.habitConfig.currentHabit;
      } else {
        this.currentHabit = enabledHabits[0];
      }
      
      console.log(`Final selected habit: ${this.currentHabit}`);
      
    } catch (error) {
      console.error("Error in determineHabitFromParameter:", error);
      this.currentHabit = "🏋️ Gym";
    }
  }
  
  createCanvas() {
    try {
      const { blockSize, spacing, columns, rows } = this.config.visual;
      const canvasWidth = columns * blockSize + (columns - 1) * spacing;
      const canvasHeight = rows * blockSize + (rows - 1) * spacing;
      
      console.log(`Creating canvas: ${canvasWidth}x${canvasHeight}`);
      
      let canvas = new DrawContext();
      canvas.size = new Size(canvasWidth, canvasHeight);
      canvas.opaque = false;
      
      return canvas;
    } catch (error) {
      console.error("Error creating canvas:", error);
      throw error;
    }
  }
  
  drawHabitGrid(canvas) {
    const { blockSize, spacing, totalDays, colors } = this.config.visual;
    
    const today = new Date();
    
    // Draw grid lines first (as thin rectangles)
    canvas.setFillColor(new Color(colors.gridLine));
    const canvasWidth = this.config.visual.columns * blockSize + (this.config.visual.columns - 1) * spacing;
    const canvasHeight = this.config.visual.rows * blockSize + (this.config.visual.rows - 1) * spacing;

    for (let col = 0; col <= this.config.visual.columns; col++) {
      const x = col * (blockSize + spacing) - spacing / 2;
      canvas.fillRect(new Rect(x, 0, 1, canvasHeight));
    }
    for (let row = 0; row <= this.config.visual.rows; row++) {
      const y = row * (blockSize + spacing) - spacing / 2;
      canvas.fillRect(new Rect(0, y, canvasWidth, 1));
    }

    for (let i = 0; i < totalDays; i++) {
      let date = this.utils.addDays(this.initDate, i);
      if (date > today) break; // No future days
      
      let dateStr = this.utils.formatDate(date);
      let col = Math.floor(i / 7); // 7 days per column (week)
      let row = i % 7;
      
      let x = col * (blockSize + spacing);
      let y = row * (blockSize + spacing);
      
      // Determine completion status
      let isDone = false;
      if (this.config.features.multipleHabits && 
          this.history[dateStr] && 
          typeof this.history[dateStr] === 'object') {
        isDone = this.history[dateStr][this.currentHabit] === true;
      } else {
        isDone = this.history[dateStr] === true;
      }
      
      // Choose color based on completion
      let color;
      if (isDone) {
        color = new Color(colors.completed);
      } else {
        color = new Color(colors.missed, colors.missedOpacity);
      }
      
      canvas.setFillColor(color);
      canvas.fillRect(new Rect(x, y, blockSize, blockSize));
    }
  }
  
  createSetupWidget() {
    let widget = new ListWidget();
    widget.backgroundColor = new Color(this.config.visual.colors.background);
    widget.setPadding(16, 16, 16, 16);
    
    let title = widget.addText("Habit Tracker");
    title.font = Font.boldSystemFont(16);
    title.textColor = new Color(this.config.visual.colors.text);
    widget.addSpacer(8);
    
    let statusText = widget.addText("Setup Required");
    statusText.font = Font.systemFont(14);
    statusText.textColor = Color.orange();
    widget.addSpacer(8);
    
    let helpText = widget.addText("Run the initialization script to set up your habit tracker.");
    helpText.font = Font.systemFont(12);
    helpText.textColor = new Color(this.config.visual.colors.caption);
    
    return widget;
  }
  
  toggleHabit() {
    const today = new Date();
    const todayStr = this.utils.formatDate(today);
    
    // Initialize today's entry if it doesn't exist
    if (!this.history[todayStr]) {
      if (this.habitConfig.mode === "multiple") {
        this.history[todayStr] = {};
      } else {
        this.history[todayStr] = false;
      }
    }
    
    // Toggle the habit
    if (this.habitConfig.mode === "multiple") {
      this.history[todayStr][this.currentHabit] = !this.history[todayStr][this.currentHabit];
    } else {
      this.history[todayStr] = !this.history[todayStr];
    }
    
    // Save the updated history
    this.utils.saveJSON(this.config.storage.historyFile, this.history);
  }
  
  createWidget() {
    try {
      console.log("Creating widget...");
      
      // Check if setup is complete - but allow widget to show even if not complete
      if (!this.setupComplete) {
        console.log("Setup not complete, but showing widget anyway with fallback data");
        // Don't return setup widget, continue with main widget using fallback data
      }
      
      console.log("Creating main widget");
      
      let widget = new ListWidget();
      widget.backgroundColor = new Color(this.config.visual.colors.background);
      widget.setPadding(16, 16, 16, 16);
      
      // Add tap handler for toggling today's habit

      
      // Title with habit name
      console.log(`Adding title: ${this.currentHabit}`);
      let title = widget.addText(this.currentHabit || "Habit Tracker");
      title.font = Font.boldSystemFont(this.config.visual.fonts.title);
      title.textColor = new Color(this.config.visual.colors.text);
      widget.addSpacer(12);
      
      // Habit grid - with better error handling
      console.log("Creating habit grid...");
      try {
        let canvas = this.createCanvas();
        this.drawHabitGrid(canvas);
        let image = canvas.getImage();
        widget.addImage(image);
        widget.addSpacer(12);
        console.log("Habit grid added successfully");
      } catch (gridError) {
        console.error("Error creating habit grid:", gridError);
        console.error("Grid error details:", gridError.message);
        
        // Add detailed error information for debugging
        let gridErrorText = widget.addText(`Grid Error: ${gridError.message}`);
        gridErrorText.font = Font.systemFont(10);
        gridErrorText.textColor = Color.red();
        widget.addSpacer(4);
        
        // Add debug info
        let debugText = widget.addText(`InitDate: ${this.initDate ? this.initDate.toDateString() : 'undefined'}`);
        debugText.font = Font.systemFont(8);
        debugText.textColor = Color.gray();
        widget.addSpacer(4);
        
        let historyText = widget.addText(`History entries: ${Object.keys(this.history).length}`);
        historyText.font = Font.systemFont(8);
        historyText.textColor = Color.gray();
        widget.addSpacer(12);
      }
      
      // Streak counter (if enabled)
      if (this.config.features.streakCounter) {
        console.log("Adding streak counter...");
        try {
          const currentStreak = this.utils.calculateCurrentStreak(
            this.history, 
            this.config.features.multipleHabits ? this.currentHabit : null
          );
          
          let streakText = widget.addText(`🔥 ${currentStreak} days`);
          streakText.font = Font.boldSystemFont(this.config.visual.fonts.streak);
          streakText.textColor = new Color(this.config.visual.colors.streak);
          widget.addSpacer(6);
          console.log(`Streak counter added: ${currentStreak} days`);
        } catch (streakError) {
          console.error("Error adding streak counter:", streakError);
        }
      }
      
      // Monthly summary (if enabled)
      if (this.config.features.monthlySummary) {
        console.log("Adding monthly summary...");
        try {
          const now = new Date();
          const summary = this.utils.getMonthlySummary(
            this.history, 
            now.getFullYear(), 
            now.getMonth() + 1,
            this.config.features.multipleHabits ? this.currentHabit : null
          );
          
          let monthlyText = widget.addText(`${summary.completed}/${summary.total} this month`);
          monthlyText.font = Font.systemFont(this.config.visual.fonts.caption);
          monthlyText.textColor = new Color(this.config.visual.colors.caption);
          console.log(`Monthly summary added: ${summary.completed}/${summary.total}`);
        } catch (summaryError) {
          console.error("Error adding monthly summary:", summaryError);
        }
      }
      
      console.log("Widget created successfully");
      return widget;
      
    } catch (error) {
      console.error("Error in createWidget:", error);
      throw error; // Re-throw to be handled by run()
    }
  }
  
  run() {
    try {
      console.log("Starting widget execution...");
      console.log(`Setup complete: ${this.setupComplete}`);
      console.log(`Current habit: ${this.currentHabit}`);
      console.log(`History entries: ${Object.keys(this.history).length}`);
      console.log(`Init date: ${this.initDate ? this.initDate.toISOString() : 'undefined'}`);
      
      const widget = this.createWidget();
      
      if (config.runsInApp) {
        // If running in app, show widget preview
        widget.presentMedium();
      } else {
        // If running in widget, set the widget
        Script.setWidget(widget);
      }
      
      Script.complete();
      
    } catch (error) {
      console.error("Error creating widget:", error);
      console.error("Error stack:", error.stack);
      
      // Create a more detailed error widget
      let errorWidget = new ListWidget();
      errorWidget.backgroundColor = new Color("#1a1a1a");
      errorWidget.setPadding(16, 16, 16, 16);
      
      let errorTitle = errorWidget.addText("Habit Tracker Error");
      errorTitle.font = Font.boldSystemFont(14);
      errorTitle.textColor = Color.white();
      errorWidget.addSpacer(8);
      
      let errorMessage = errorWidget.addText(error.message || "Unknown error occurred");
      errorMessage.font = Font.systemFont(12);
      errorMessage.textColor = Color.red();
      errorWidget.addSpacer(8);
      
      let helpText = errorWidget.addText("Check console logs for details. Try running init.js again.");
      helpText.font = Font.systemFont(10);
      helpText.textColor = Color.gray();
      
      if (config.runsInApp) {
        errorWidget.presentMedium();
      } else {
        Script.setWidget(errorWidget);
      }
      
      Script.complete();
    }
  }
}

// Create and run the widget
const habitWidget = new HabitTrackerWidget();
habitWidget.run();