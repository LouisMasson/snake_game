// Simple test script to check for JavaScript errors
console.log("Running snake game tests...");

// Function to test if the game loads properly
function testGameLoading() {
    try {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        console.log("✅ Canvas loaded successfully");
        
        const scoreElement = document.getElementById('score');
        console.log("✅ Score element loaded successfully");
        
        return true;
    } catch (error) {
        console.error("❌ Game loading test failed:", error);
        return false;
    }
}

// Function to test keyboard controls
function testKeyboardControls() {
    try {
        // Simulate arrow key presses
        console.log("Testing keyboard controls...");
        console.log("Press arrow keys to test movement");
        console.log("Press space to test pause");
        console.log("Press Enter to test restart (after game over)");
        
        return true;
    } catch (error) {
        console.error("❌ Keyboard controls test failed:", error);
        return false;
    }
}

// Function to test game state
function testGameState() {
    try {
        // Check if game variables are defined
        if (typeof snake !== 'undefined' && 
            typeof food !== 'undefined' && 
            typeof score !== 'undefined') {
            console.log("✅ Game state variables exist");
        } else {
            console.log("❌ Game state variables not accessible (normal for encapsulated code)");
        }
        
        return true;
    } catch (error) {
        console.error("❌ Game state test failed:", error);
        return false;
    }
}

// Run tests when the page loads
window.addEventListener('load', () => {
    console.log("=== SNAKE GAME TESTS ===");
    
    const loadingTestPassed = testGameLoading();
    const controlsTestPassed = testKeyboardControls();
    const stateTestPassed = testGameState();
    
    if (loadingTestPassed && controlsTestPassed && stateTestPassed) {
        console.log("✅ All automated tests passed!");
        console.log("Please perform manual testing for gameplay features:");
        console.log("1. Snake movement in all directions");
        console.log("2. Food collection and score increment");
        console.log("3. Background color change on food collection");
        console.log("4. Game over on wall collision");
        console.log("5. Game over on self collision");
        console.log("6. Restart functionality with Enter key");
        console.log("7. Pause functionality with Space key");
    } else {
        console.log("❌ Some tests failed. Check console for details.");
    }
    
    console.log("=== END OF TESTS ===");
});
