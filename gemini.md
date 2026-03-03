# Gemini CLI Project Guide

This file contains instructions and configurations specific to using the Gemini CLI within this project.

## Purpose

This project is an auto-battler game simulator. It simulates a battle between two teams of units and visualizes the outcome as an animation.

## Available Commands

*   `npm run dev`: Starts the development server to view and interact with the battle simulation.
*   `npm test`: Runs the simulation engine tests in a Node.js environment.

## Architecture

The project follows a clean separation of concerns between the simulation engine and the UI renderer.

*   **Engine (`src/engine`):** A pure, synchronous TypeScript module that can run independently. It takes the initial state of the board, runs a complete, deterministic, tick-based simulation, and returns the result, including a detailed battle log.
*   **Renderer (`src/renderer`):** A React application that provides the user interface. It sets up the initial unit placements, calls the engine to run the simulation, and then animates the results by processing the battle log.
*   **Types (`src/types`):** A central location for all data structures, acting as a contract that ensures the engine and renderer are aligned on the data they exchange.

## Key Components

| File Path                 | Description                                                                                                                                                             | Key Symbols                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `src/renderer/App.tsx`      | The main React component. It manages the frontend, handles user interaction, calls the simulation engine, and renders the animated playback of the battle.             | `App`, `runSimulation`, `playBattleLog`     |
| `src/engine/simulator.ts` | Contains the core logic of the auto-battler. It runs the entire battle in a deterministic, tick-based loop, handling unit AI, movement, and combat.                       | `BattleSimulator`, `runSimulation`        |
| `src/engine/units.ts`     | Acts as a database of unit statistics, defining the base stats (HP, attack, range, etc.) for every type of unit in the game.                                             | `UNIT_TEMPLATES`                          |
| `src/engine/unitFactory.ts` | A factory function responsible for creating new unit instances. It takes a template, assigns a unique ID, and initializes the unit's state for the simulation.         | `createUnit`                              |
| `src/types/index.ts`      | The "shared kernel" of the application. It defines the data structures and types that act as a contract between the engine and the renderer.                            | `Unit`, `BoardState`, `SimulationResult`  |

## Custom Skills

(No custom skills are currently defined for this project.)
