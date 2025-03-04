/**
 * Document Type Model
 * 
 * This file defines the Document Type model for the GRC-20 publisher.
 * It implements the relationship-based data model for document type entities.
 */

import { BaseModel } from './base-model.js';
import { Graph, EntityOp } from '../core/graph.js';

export class DocumentType extends BaseModel {
  constructor(id: string | null, name: string) {
    super(id, name);
  }

  /**
   * Create a new Document Type entity
   * 
   * @param name The document type name
   * @returns The created document type entity
   */
  static create(name: string): DocumentType {
    return new DocumentType(null, name);
  }

  /**
   * Generate the operations to create this document type entity
   * 
   * @param documentTypeTypeId The document type type ID
   * @returns The operations to create this document type entity
   */
  generateOps(documentTypeTypeId: string): EntityOp[] {
    const { id: documentTypeId, ops } = Graph.createEntity({
      name: this.name,
      types: [documentTypeTypeId],
      properties: {},
    });

    // Set the ID of this document type entity
    this.id = documentTypeId;

    return ops;
  }
}
