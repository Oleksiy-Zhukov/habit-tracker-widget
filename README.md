# iOS Scriptable Habit Tracker Widget

## Overview

This project provides a customizable habit tracking widget for iOS, built using Scriptable. It allows users to visualize their daily habits directly on their home screen, offering a constant, subtle reminder and a clear overview of their progress without needing to open a dedicated application.

## Motivation

I initially developed this habit tracker for my personal use. I found that traditional habit tracking apps often required an extra step of opening the application, which sometimes broke the flow and reduced consistency. My goal was to create a solution that integrates seamlessly into my daily routine, providing an immediate visual cue of my habits every time I picked up my phone. The positive impact on my own consistency inspired me to share this tool, hoping it can benefit others in their habit-building journey.

## Features

*   **Home Screen Integration:** Visualize your habit progress directly on your iOS home screen.
*   **Daily Overview:** Quickly see your completed and missed days at a glance.
*   **Customizable Grid:** Adjust the size and layout of the habit grid to suit your preferences.
*   **Streak Tracking:** Monitor your current habit streak.
*   **Monthly Summary:** Get a quick summary of your monthly habit completion.

## Benefits of Habit Tracking with a Widget

Tracking habits is a powerful way to build discipline and achieve personal goals. When your habit tracker is a widget on your home screen, the benefits are amplified:

*   **Constant Reinforcement:** Every time you unlock your phone, you're reminded of your commitments, fostering greater accountability.
*   **Reduced Friction:** No need to open an app; a quick glance is all it takes to update or review your progress.
*   **Visual Progress:** Seeing your progress visually can be incredibly motivating, encouraging you to maintain your streaks and build momentum.
*   **Mindful Engagement:** It encourages a moment of reflection on your habits throughout the day, helping to embed them more deeply into your routine.

## Setup Instructions

To get this habit tracker widget running on your iOS device, follow these steps:

1.  **Install Scriptable:** Download and install the [Scriptable app](https://apps.apple.com/us/app/scriptable/id1405459188) from the Apple App Store.
2.  **Download Script Files:** Obtain the `habit-widget.js` and `init.js` files from this GitHub repository. You can download them individually or clone the repository.
3.  **Import into Scriptable:**
    *   Open the Scriptable app.
    *   Tap the `+` icon in the top right corner to create a new script.
    *   Paste the content of `init.js` into this new script and save it as `init.js`.
    *   Repeat the process for `habit-widget.js`, saving it as `habit-widget.js`.
4.  **Run Initialization Script:**
    *   In the Scriptable app, run the `init.js` script once. This will set up the necessary data files for your habits.
5.  **Add Widget to Home Screen:**
    *   Go to your iOS home screen.
    *   Long-press on an empty area until apps start jiggling.
    *   Tap the `+` icon in the top left corner.
    *   Search for "Scriptable" and select it.
    *   Choose the size of the widget you prefer (e.g., Small, Medium, Large).
    *   Tap "Add Widget."
6.  **Configure the Widget:**
    *   Long-press on the newly added Scriptable widget on your home screen.
    *   Tap "Edit Widget."
    *   Under "Script," select `habit-widget.js`.
    *   (Optional) If you have multiple habits configured in `init.js`, you can specify a `Parameter` to display a specific habit on this widget. For example, enter the habit name (e.g., "🏋️ Gym") or its index if you configured them numerically.

## Limitations

*   **Scriptable Dependency:** This widget requires the Scriptable app to function.
*   **Manual Habit Toggling:** Currently, marking a habit as complete or incomplete requires running a separate script or interacting with the widget (if a toggle shortcut is set up externally).
*   **Limited Customization:** While some visual aspects are configurable, deep UI customization is restricted by Scriptable's capabilities.
*   **Data Storage:** Habit data is stored locally on your device within Scriptable's sandboxed environment, not synced to the cloud unless you manually manage Scriptable's iCloud Drive sync.
*   **No Built-in Notifications:** The widget itself does not provide notifications for missed habits.

## Contributing

Feel free to fork this repository, make improvements, and submit pull requests. Any contributions to enhance functionality, improve UI, or add new features are welcome.

## License

This project is open-source and available under the MIT License. See the `LICENSE` file for more details.


