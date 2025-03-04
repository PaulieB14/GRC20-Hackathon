/**
 * Person Model
 * 
 * This file defines the Person model for the GRC-20 publisher.
 * It implements the relationship-based data model for person entities.
 */

import { BaseModel } from './base-model.js';
import { Graph, EntityOp } from '../core/graph.js';

export class Person extends BaseModel {
  constructor(id: string | null, name: string) {
    super(id, name);
  }

  /**
   * Create a new Person entity
   * 
   * @param name The person's name
   * @returns The created person entity
   */
  static create(name: string): Person {
    return new Person(null, name);
  }

  /**
   * Generate the operations to create this person entity
   * 
   * @param personTypeId The person type ID
   * @returns The operations to create this person entity
   */
  generateOps(personTypeId: string): EntityOp[] {
    const { id: personId, ops } = Graph.createEntity({
      name: this.name,
      types: [personTypeId],
      properties: {},
    });

    // Set the ID of this person entity
    this.id = personId;

    return ops;
  }
}
