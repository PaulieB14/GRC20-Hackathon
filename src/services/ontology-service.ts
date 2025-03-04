/**
 * Ontology Service
 * 
 * This file provides services for setting up and managing the ontology for the GRC-20 spaces.
 * It handles the creation of types, properties, and relation types.
 */

import { TypeIds, PropertyIds, RelationTypeIds, SpaceIds } from '../config/constants.js';
import { EntityOp } from '../core/graph.js';

/**
 * Ontology Service
 * 
 * Provides services for setting up and managing the ontology for the GRC-20 spaces.
 */
export class OntologyService {
  /**
   * Generate operations to set up the deed ontology
   * 
   * @returns The operations to set up the deed ontology
   */
  static generateDeedOntologyOps(): EntityOp[] {
    const ops: EntityOp[] = [];

    // Create entity types
    ops.push(
      {
        type: 'CREATE_ENTITY',
        id: TypeIds.DEED,
        name: 'Deed',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: TypeIds.PERSON,
        name: 'Person',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: TypeIds.DOCUMENT_TYPE,
        name: 'Document Type',
        types: [],
      }
    );

    // Create property types
    ops.push(
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.INSTRUMENT_NUMBER,
        name: 'Instrument Number',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.RECORD_DATE,
        name: 'Record Date',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.BOOK_TYPE,
        name: 'Book Type',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.BOOK_PAGE,
        name: 'Book Page',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.COMMENTS,
        name: 'Comments',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.PROPERTY_ADDRESS,
        name: 'Property Address',
        types: [],
      }
    );

    // Create relation types
    ops.push(
      {
        type: 'CREATE_ENTITY',
        id: RelationTypeIds.BUYER,
        name: 'Buyer',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: RelationTypeIds.SELLER,
        name: 'Seller',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: RelationTypeIds.DOCUMENT_TYPE,
        name: 'Document Type',
        types: [],
      }
    );

    return ops;
  }

  /**
   * Generate operations to set up the permit ontology
   * 
   * @returns The operations to set up the permit ontology
   */
  static generatePermitOntologyOps(): EntityOp[] {
    const ops: EntityOp[] = [];

    // Create entity types
    ops.push(
      {
        type: 'CREATE_ENTITY',
        id: TypeIds.PERMIT,
        name: 'Permit',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: TypeIds.RECORD_TYPE,
        name: 'Record Type',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: TypeIds.STATUS,
        name: 'Status',
        types: [],
      }
    );

    // Create property types
    ops.push(
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.RECORD_NUMBER,
        name: 'Record Number',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.DESCRIPTION,
        name: 'Description',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.PROJECT_NAME,
        name: 'Project Name',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: PropertyIds.ADDRESS,
        name: 'Address',
        types: [],
      }
    );

    // Create relation types
    ops.push(
      {
        type: 'CREATE_ENTITY',
        id: RelationTypeIds.RECORD_TYPE,
        name: 'Record Type',
        types: [],
      },
      {
        type: 'CREATE_ENTITY',
        id: RelationTypeIds.STATUS,
        name: 'Status',
        types: [],
      }
    );

    return ops;
  }

  /**
   * Set up the deed ontology
   * 
   * @param spaceId The deed space ID
   * @returns A promise that resolves when the ontology is set up
   */
  static async setupDeedOntology(spaceId: string = SpaceIds.DEEDS): Promise<void> {
    const ops = this.generateDeedOntologyOps();
    
    // TODO: Submit operations to the GRC-20 space
    console.log(`Setting up deed ontology for space ${spaceId} with ${ops.length} operations`);
  }

  /**
   * Set up the permit ontology
   * 
   * @param spaceId The permit space ID
   * @returns A promise that resolves when the ontology is set up
   */
  static async setupPermitOntology(spaceId: string = SpaceIds.PERMITS): Promise<void> {
    const ops = this.generatePermitOntologyOps();
    
    // TODO: Submit operations to the GRC-20 space
    console.log(`Setting up permit ontology for space ${spaceId} with ${ops.length} operations`);
  }

  /**
   * Set up both the deed and permit ontologies
   * 
   * @param deedSpaceId The deed space ID
   * @param permitSpaceId The permit space ID
   * @returns A promise that resolves when the ontologies are set up
   */
  static async setupOntologies(
    deedSpaceId: string = SpaceIds.DEEDS,
    permitSpaceId: string = SpaceIds.PERMITS
  ): Promise<void> {
    await this.setupDeedOntology(deedSpaceId);
    await this.setupPermitOntology(permitSpaceId);
  }
}
