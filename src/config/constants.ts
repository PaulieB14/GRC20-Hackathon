/**
 * Constants
 * 
 * This file defines constants used throughout the application.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Type IDs
 * 
 * These IDs are used to identify entity types in the GRC-20 space.
 */
export const TypeIds = {
  // Entity types
  DEED: 'deed-type-id',
  PERMIT: 'permit-type-id',
  PERSON: 'person-type-id',
  DOCUMENT_TYPE: 'document-type-type-id',
  RECORD_TYPE: 'record-type-type-id',
  STATUS: 'status-type-id',
};

/**
 * Property IDs
 * 
 * These IDs are used to identify properties in the GRC-20 space.
 */
export const PropertyIds = {
  // Deed properties
  INSTRUMENT_NUMBER: 'instrument-number-property-id',
  RECORD_DATE: 'record-date-property-id',
  BOOK_TYPE: 'book-type-property-id',
  BOOK_PAGE: 'book-page-property-id',
  COMMENTS: 'comments-property-id',
  PROPERTY_ADDRESS: 'property-address-property-id',
  
  // Permit properties
  RECORD_NUMBER: 'record-number-property-id',
  DESCRIPTION: 'description-property-id',
  PROJECT_NAME: 'project-name-property-id',
  ADDRESS: 'address-property-id',
};

/**
 * Relation Type IDs
 * 
 * These IDs are used to identify relation types in the GRC-20 space.
 */
export const RelationTypeIds = {
  // Deed relations
  BUYER: 'buyer-relation-type-id',
  SELLER: 'seller-relation-type-id',
  DOCUMENT_TYPE: 'document-type-relation-type-id',
  
  // Permit relations
  RECORD_TYPE: 'record-type-relation-type-id',
  STATUS: 'status-relation-type-id',
};

/**
 * Space IDs
 * 
 * These IDs identify the GRC-20 spaces for deeds and permits.
 */
export const SpaceIds = {
  DEEDS: process.env.DEEDS_SPACE_ID || '',
  PERMITS: process.env.PERMITS_SPACE_ID || '',
};
