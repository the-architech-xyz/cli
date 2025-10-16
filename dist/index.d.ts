#!/usr/bin/env node
/**
 * The Architech CLI V1 - Agent-Based Architecture
 *
 * Agent-based project generation from YAML recipes
 * Flow: architech.yaml → Orchestrator → Agents → Adapters → Blueprints
 */
import { Command } from 'commander';
declare const program: Command;
export { program };
