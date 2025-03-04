/**
 * Base Model
 * 
 * This file defines the base model for all entities in the GRC-20 publisher.
 */

export abstract class BaseModel {
  protected id: string | null;
  protected name: string;

  constructor(id: string | null, name: string) {
    this.id = id;
    this.name = name;
  }

  /**
   * Get the ID of this entity
   * 
   * @returns The entity ID or null if not set
   */
  getId(): string | null {
    return this.id;
  }

  /**
   * Get the name of this entity
   * 
   * @returns The entity name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Set the ID of this entity
   * 
   * @param id The entity ID
   */
  setId(id: string): void {
    this.id = id;
  }

  /**
   * Set the name of this entity
   * 
   * @param name The entity name
   */
  setName(name: string): void {
    this.name = name;
  }
}
