/**
 * Deed Model
 * 
 * This file defines the Deed model for the GRC-20 publisher.
 * It implements the relationship-based data model for deed entities.
 */

import { BaseModel } from './base-model';
import { Person } from './person';
import { DocumentType } from './document-type';
import { Graph, EntityOp, PropertyValue } from '../core/graph';
import { PropertyIds } from '../config/constants';

export interface DeedProperties {
  instrumentNumber: string;
  recordDate?: string;
  bookType?: string;
  bookPage?: string;
  comments?: string;
  propertyAddress?: string;
}

export class Deed extends BaseModel {
  private properties: DeedProperties;
  private buyer?: Person;
  private seller?: Person;
  private documentType?: DocumentType;

  constructor(
    id: string | null,
    name: string,
    properties: DeedProperties
  ) {
    super(id, name);
    this.properties = properties;
  }

  /**
   * Create a new Deed entity
   * 
   * @param properties The deed properties
   * @param typeId The deed type ID
   * @returns The created deed entity
   */
  static create(properties: DeedProperties, typeId: string): Deed {
    // Use property address in name if available, otherwise use instrument number
    const name = properties.propertyAddress 
      ? `Deed for ${properties.propertyAddress}`
      : `Deed #${properties.instrumentNumber}`;
    
    return new Deed(null, name, properties);
  }

  /**
   * Set the buyer for this deed
   * 
   * @param buyer The buyer person entity
   */
  setBuyer(buyer: Person): void {
    this.buyer = buyer;
  }

  /**
   * Set the seller for this deed
   * 
   * @param seller The seller person entity
   */
  setSeller(seller: Person): void {
    this.seller = seller;
  }

  /**
   * Set the document type for this deed
   * 
   * @param documentType The document type entity
   */
  setDocumentType(documentType: DocumentType): void {
    this.documentType = documentType;
  }

  /**
   * Generate the operations to create this deed entity and its relations
   * 
   * @param deedTypeId The deed type ID
   * @param buyerRelationTypeId The buyer relation type ID
   * @param sellerRelationTypeId The seller relation type ID
   * @param documentTypeRelationTypeId The document type relation type ID
   * @returns The operations to create this deed entity and its relations
   */
  generateOps(
    deedTypeId: string,
    buyerRelationTypeId: string,
    sellerRelationTypeId: string,
    documentTypeRelationTypeId: string
  ): EntityOp[] {
    const ops: EntityOp[] = [];

    // Create the deed entity
    const { id: deedId, ops: deedOps } = Graph.createEntity({
      name: this.name,
      types: [deedTypeId],
      properties: {
        [PropertyIds.INSTRUMENT_NUMBER]: {
          type: 'TEXT',
          value: this.properties.instrumentNumber,
        },
        ...(this.properties.recordDate && {
          [PropertyIds.RECORD_DATE]: {
            type: 'TEXT',
            value: this.properties.recordDate,
          },
        }),
        ...(this.properties.bookType && {
          [PropertyIds.BOOK_TYPE]: {
            type: 'TEXT',
            value: this.properties.bookType,
          },
        }),
        ...(this.properties.bookPage && {
          [PropertyIds.BOOK_PAGE]: {
            type: 'TEXT',
            value: this.properties.bookPage,
          },
        }),
        ...(this.properties.comments && {
          [PropertyIds.COMMENTS]: {
            type: 'TEXT',
            value: this.properties.comments,
          },
        }),
        ...(this.properties.propertyAddress && {
          [PropertyIds.PROPERTY_ADDRESS]: {
            type: 'TEXT',
            value: this.properties.propertyAddress,
          },
        }),
      },
    });

    // Set the ID of this deed entity
    this.id = deedId;
    ops.push(...deedOps);

    // Add relations to buyer, seller, and document type if they exist
    if (this.buyer && this.buyer.id) {
      const { ops: buyerRelationOps } = Graph.createRelation({
        fromId: deedId,
        toId: this.buyer.id,
        relationTypeId: buyerRelationTypeId,
      });
      ops.push(...buyerRelationOps);
    }

    if (this.seller && this.seller.id) {
      const { ops: sellerRelationOps } = Graph.createRelation({
        fromId: deedId,
        toId: this.seller.id,
        relationTypeId: sellerRelationTypeId,
      });
      ops.push(...sellerRelationOps);
    }

    if (this.documentType && this.documentType.id) {
      const { ops: documentTypeRelationOps } = Graph.createRelation({
        fromId: deedId,
        toId: this.documentType.id,
        relationTypeId: documentTypeRelationTypeId,
      });
      ops.push(...documentTypeRelationOps);
    }

    return ops;
  }

  /**
   * Get the instrument number of this deed
   * 
   * @returns The instrument number
   */
  getInstrumentNumber(): string {
    return this.properties.instrumentNumber;
  }

  /**
   * Get the property address of this deed
   * 
   * @returns The property address or undefined if not set
   */
  getPropertyAddress(): string | undefined {
    return this.properties.propertyAddress;
  }

  /**
   * Set the property address of this deed
   * 
   * @param address The property address
   */
  setPropertyAddress(address: string): void {
    this.properties.propertyAddress = address;
    
    // Update the name if the property address is set
    if (address) {
      this.name = `Deed for ${address}`;
    }
  }

  /**
   * Generate operations to update the property address of this deed
   * 
   * @param propertyAddressId The property address property ID
   * @returns The operations to update the property address
   */
  generatePropertyAddressUpdateOps(propertyAddressId: string): EntityOp[] {
    if (!this.id || !this.properties.propertyAddress) {
      return [];
    }

    return [
      {
        type: 'SET_PROPERTY',
        entityId: this.id,
        propertyId: propertyAddressId,
        value: {
          type: 'TEXT',
          value: this.properties.propertyAddress,
        },
      },
    ];
  }

  /**
   * Generate operations to update the name of this deed
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
