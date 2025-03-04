/**
 * Record Type Model
 * 
 * This file defines the Record Type model for the GRC-20 publisher.
 * It implements the relationship-based data model for record type entities.
 */

import { BaseModel } from './base-model.js';
import { Graph, EntityOp } from '../core/graph.js';

export class RecordType extends BaseModel {
  constructor(id: string | null, name: string) {
    super(id, name);
  }

  /**
   * Create a new Record Type entity
   * 
   * @param name The record type name
   * @returns The created record type entity
   */
  static create(name: string): RecordType {
    return new RecordType(null, name);
  }

  /**
   * Generate the operations to create this record type entity
   * 
   * @param recordTypeTypeId The record type type ID
   * @returns The operations to create this record type entity
   */
  generateOps(recordTypeTypeId: string): EntityOp[] {
    const { id: recordTypeId, ops } = Graph.createEntity({
      name: this.name,
      types: [recordTypeTypeId],
      properties: {},
    });

    // Set the ID of this record type entity
    this.id = recordTypeId;

    return ops;
  }
}
