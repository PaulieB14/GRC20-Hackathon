/**
 * Permit Model
 * 
 * This file defines the Permit model for the GRC-20 publisher.
 * It implements the relationship-based data model for permit entities.
 */

import { BaseModel } from './base-model.js';
import { RecordType } from './record-type.js';
import { Status } from './status.js';
import { Graph, EntityOp } from '../core/graph.js';
import { PropertyIds } from '../config/constants.js';

export interface PermitProperties {
  recordNumber: string;
  description?: string;
  projectName?: string;
  address?: string;
}

export class Permit extends BaseModel {
  private properties: PermitProperties;
  private recordType?: RecordType;
  private status?: Status;

  constructor(
    id: string | null,
    name: string,
    properties: PermitProperties
  ) {
    super(id, name);
    this.properties = properties;
  }

  /**
   * Create a new Permit entity
   * 
   * @param properties The permit properties
   * @returns The created permit entity
   */
  static create(properties: PermitProperties): Permit {
    // Use address in name if available, otherwise use record number
    const name = properties.address 
      ? `Permit for ${properties.address}`
      : `Permit #${properties.recordNumber}`;
    
    return new Permit(null, name, properties);
  }

  /**
   * Set the record type for this permit
   * 
   * @param recordType The record type entity
   */
  setRecordType(recordType: RecordType): void {
    this.recordType = recordType;
  }

  /**
   * Set the status for this permit
   * 
   * @param status The status entity
   */
  setStatus(status: Status): void {
    this.status = status;
  }

  /**
   * Generate the operations to create this permit entity and its relations
   * 
   * @param permitTypeId The permit type ID
   * @param recordTypeRelationTypeId The record type relation type ID
   * @param statusRelationTypeId The status relation type ID
   * @returns The operations to create this permit entity and its relations
   */
  generateOps(
    permitTypeId: string,
    recordTypeRelationTypeId: string,
    statusRelationTypeId: string
  ): EntityOp[] {
    const ops: EntityOp[] = [];

    // Create the permit entity
    const { id: permitId, ops: permitOps } = Graph.createEntity({
      name: this.name,
      types: [permitTypeId],
      properties: {
        [PropertyIds.RECORD_NUMBER]: {
          type: 'TEXT',
          value: this.properties.recordNumber,
        },
        ...(this.properties.description && {
          [PropertyIds.DESCRIPTION]: {
            type: 'TEXT',
            value: this.properties.description,
          },
        }),
        ...(this.properties.projectName && {
          [PropertyIds.PROJECT_NAME]: {
            type: 'TEXT',
            value: this.properties.projectName,
          },
        }),
        ...(this.properties.address && {
          [PropertyIds.ADDRESS]: {
            type: 'TEXT',
            value: this.properties.address,
          },
        }),
      },
    });

    // Set the ID of this permit entity
    this.id = permitId;
    ops.push(...permitOps);

    // Add relations to record type and status if they exist
    if (this.recordType && this.recordType.getId()) {
      const { ops: recordTypeRelationOps } = Graph.createRelation({
        fromId: permitId,
        toId: this.recordType.getId()!,
        relationTypeId: recordTypeRelationTypeId,
      });
      ops.push(...recordTypeRelationOps);
    }

    if (this.status && this.status.getId()) {
      const { ops: statusRelationOps } = Graph.createRelation({
        fromId: permitId,
        toId: this.status.getId()!,
        relationTypeId: statusRelationTypeId,
      });
      ops.push(...statusRelationOps);
    }

    return ops;
  }

  /**
   * Get the record number of this permit
   * 
   * @returns The record number
   */
  getRecordNumber(): string {
    return this.properties.recordNumber;
  }

  /**
   * Get the address of this permit
   * 
   * @returns The address or undefined if not set
   */
  getAddress(): string | undefined {
    return this.properties.address;
  }

  /**
   * Set the address of this permit
   * 
   * @param address The address
   */
  setAddress(address: string): void {
    this.properties.address = address;
    
    // Update the name if the address is set
    if (address) {
      this.setName(`Permit for ${address}`);
    }
  }

  /**
   * Generate operations to update the address of this permit
   * 
   * @param addressPropertyId The address property ID
   * @returns The operations to update the address
   */
  generateAddressUpdateOps(addressPropertyId: string): EntityOp[] {
    if (!this.id || !this.properties.address) {
      return [];
    }

    return [
      {
        type: 'SET_PROPERTY',
        entityId: this.id,
        propertyId: addressPropertyId,
        value: {
          type: 'TEXT',
          value: this.properties.address,
        },
      },
    ];
  }

  /**
   * Generate operations to update the name of this permit
   * 
   * @returns The operations to update the name
   */
  generateNameUpdateOps(): EntityOp[] {
    if (!this.id) {
      return [];
    }

    return [
      {
        type: 'SET_NAME',
        entityId: this.id,
        name: this.name,
      },
    ];
  }
}
