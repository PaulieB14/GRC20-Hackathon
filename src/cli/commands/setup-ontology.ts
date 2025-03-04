/**
 * Setup Ontology Command
 * 
 * This file provides a CLI command to set up the ontology for the GRC-20 spaces.
 */

import { OntologyService } from '../../services/ontology-service.js';
import { SpaceIds } from '../../config/constants.js';

/**
 * Setup Ontology Command
 * 
 * Provides a CLI command to set up the ontology for the GRC-20 spaces.
 */
export class SetupOntologyCommand {
  /**
   * Execute the command
   * 
   * @param options The command options
   * @returns A promise that resolves when the command is complete
   */
  static async execute(options: {
    deedSpace?: string;
    permitSpace?: string;
    deedOnly?: boolean;
    permitOnly?: boolean;
  }): Promise<void> {
    const deedSpaceId = options.deedSpace || SpaceIds.DEEDS;
    const permitSpaceId = options.permitSpace || SpaceIds.PERMITS;

    console.log('Setting up ontology...');

    if (options.deedOnly) {
      await OntologyService.setupDeedOntology(deedSpaceId);
    } else if (options.permitOnly) {
      await OntologyService.setupPermitOntology(permitSpaceId);
    } else {
      await OntologyService.setupOntologies(deedSpaceId, permitSpaceId);
    }

    console.log('Ontology setup complete!');
  }
}

/**
 * Main function
 * 
 * This function is called when the command is executed from the CLI.
 */
export async function main(): Promise<void> {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: {
    deedSpace?: string;
    permitSpace?: string;
    deedOnly?: boolean;
    permitOnly?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--deed-space' && i + 1 < args.length) {
      options.deedSpace = args[++i];
    } else if (arg === '--permit-space' && i + 1 < args.length) {
      options.permitSpace = args[++i];
    } else if (arg === '--deed-only') {
      options.deedOnly = true;
    } else if (arg === '--permit-only') {
      options.permitOnly = true;
    } else if (arg === '--help') {
      console.log(`
Usage: setup-ontology [options]

Options:
  --deed-space <id>   The deed space ID
  --permit-space <id> The permit space ID
  --deed-only         Only set up the deed ontology
  --permit-only       Only set up the permit ontology
  --help              Show this help message
      `);
      return;
    }
  }

  await SetupOntologyCommand.execute(options);
}

// Execute the command if this file is run directly
if (require.main === module) {
  main().catch(console.error);
}
