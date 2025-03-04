/**
 * Status Model
 * 
 * This file defines the Status model for the GRC-20 publisher.
 * It implements the relationship-based data model for status entities.
 */

import { BaseModel } from './base-model.js';
import { Graph, EntityOp } from '../core/graph.js';

export class Status extends BaseModel {
  constructor(id: string | null, name: string) {
    super(id, name);
  }

  /**
   * Create a new Status entity
   * 
   * @param name The status name
   * @returns The created status entity
   */
  static create(name: string): Status {
    return new Status(null, name);
  }

  /**
   * Generate the operations to create this status entity
   * 
   * @param statusTypeId The status type ID
   * @returns The operations to create this status entity
   */
  generateOps(statusTypeId: string): EntityOp[] {
    const { id: statusId, ops } = Graph.createEntity({
      name: this.name,
      types: [statusTypeId],
      properties: {},
    });

    // Set the ID of this status entity
    this.id = statusId;

    return ops;
  }
}
