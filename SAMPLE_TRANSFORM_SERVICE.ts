/**
 * Transform Service
 * 
 * This service transforms CSV data into the relationship-based model.
 * It handles the transformation logic for both permits and deeds.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { Deed, DeedProperties } from '../models/deed';
import { Person } from '../models/person';
import { DocumentType } from '../models/document-type';
import { Permit, PermitProperties } from '../models/permit';
import { RecordType } from '../models/record-type';
import { Status } from '../models/status';
import { EntityOp } from '../core/graph';
import { TypeIds, RelationTypeIds, PropertyIds } from '../config/constants';
import { Logger } from '../utils/logger';

export interface TransformOptions {
  inputFile: string;
  outputFile: string;
  dataType: 'deeds' | 'permits';
  includeAddresses?: boolean;
}

export class TransformService {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('TransformService');
  }

  /**
   * Transform CSV data into the relationship-based model
   * 
   * @param options The transform options
   * @returns A promise that resolves when the transformation is complete
   */
  async transform(options: TransformOptions): Promise<void> {
    this.logger.info(`Transforming ${options.dataType} data from ${options.inputFile}`);
    
    // Read and parse the CSV file
    const csvData = fs.readFileSync(options.inputFile, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });
    
    this.logger.info(`Found ${records.length} records in CSV file`);
    
    // Transform the records based on the data type
    let ops: EntityOp[] = [];
    if (options.dataType === 'deeds') {
      ops = await this.transformDeeds(records, options.includeAddresses);
    } else {
      ops = await this.transformPermits(records, options.includeAddresses);
    }
    
    this.logger.info(`Generated ${ops.length} operations`);
    
    // Write the operations to the output file
    const outputDir = path.dirname(options.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(options.outputFile, JSON.stringify(ops, null, 2));
    this.logger.info(`Wrote operations to ${options.outputFile}`);
  }
  
  /**
   * Transform deed records into the relationship-based model
   * 
   * @param records The deed records from the CSV file
   * @param includeAddresses Whether to include property addresses
   * @returns The operations to create the deed entities and their relations
   */
  private async transformDeeds(records: any[], includeAddresses = false): Promise<EntityOp[]> {
    const ops: EntityOp[] = [];
    
    // Maps to track unique entities
    const personMap = new Map<string, Person>();
    const documentTypeMap = new Map<string, DocumentType>();
    
    // Load property addresses if includeAddresses is true
    let addressMap = new Map<string, string>();
    if (includeAddresses) {
      addressMap = await this.loadPropertyAddresses();
    }
    
    // Process each deed record
    for (const record of records) {
      try {
        // Get or create seller entity
        const sellerName = record.DirectName || '';
        let seller: Person;
        if (personMap.has(sellerName)) {
          seller = personMap.get(sellerName)!;
        } else {
          seller = Person.create(sellerName);
          const sellerOps = seller.generateOps(TypeIds.PERSON);
          ops.push(...sellerOps);
          personMap.set(sellerName, seller);
        }
        
        // Get or create buyer entity
        const buyerName = record.IndirectName || '';
        let buyer: Person;
        if (personMap.has(buyerName)) {
          buyer = personMap.get(buyerName)!;
        } else {
          buyer = Person.create(buyerName);
          const buyerOps = buyer.generateOps(TypeIds.PERSON);
          ops.push(...buyerOps);
          personMap.set(buyerName, buyer);
        }
        
        // Get or create document type entity
        const docTypeName = record.DocTypeDescription || 'DEED';
        let documentType: DocumentType;
        if (documentTypeMap.has(docTypeName)) {
          documentType = documentTypeMap.get(docTypeName)!;
        } else {
          documentType = DocumentType.create(docTypeName);
          const docTypeOps = documentType.generateOps(TypeIds.DOCUMENT_TYPE);
          ops.push(...docTypeOps);
          documentTypeMap.set(docTypeName, documentType);
        }
        
        // Create deed entity
        const deedProperties: DeedProperties = {
          instrumentNumber: record.InstrumentNumber,
          recordDate: record.RecordDate,
          bookType: record.BookType,
          bookPage: record.BookPage,
          comments: record.Comments,
        };
        
        // Add property address if available
        if (includeAddresses && addressMap.has(record.InstrumentNumber)) {
          deedProperties.propertyAddress = addressMap.get(record.InstrumentNumber);
        }
        
        const deed = Deed.create(deedProperties, TypeIds.DEED);
        deed.setBuyer(buyer);
        deed.setSeller(seller);
        deed.setDocumentType(documentType);
        
        const deedOps = deed.generateOps(
          TypeIds.DEED,
          RelationTypeIds.BUYER,
          RelationTypeIds.SELLER,
          RelationTypeIds.DOCUMENT_TYPE
        );
        
        ops.push(...deedOps);
        
        this.logger.debug(`Processed deed ${record.InstrumentNumber}`);
      } catch (error) {
        this.logger.error(`Error processing deed ${record.InstrumentNumber}: ${error}`);
      }
    }
    
    return ops;
  }
  
  /**
   * Transform permit records into the relationship-based model
   * 
   * @param records The permit records from the CSV file
   * @param includeAddresses Whether to include property addresses
   * @returns The operations to create the permit entities and their relations
   */
  private async transformPermits(records: any[], includeAddresses = false): Promise<EntityOp[]> {
    const ops: EntityOp[] = [];
    
    // Maps to track unique entities
    const recordTypeMap = new Map<string, RecordType>();
    const statusMap = new Map<string, Status>();
    
    // Load property addresses if includeAddresses is true
    let addressMap = new Map<string, string>();
    if (includeAddresses) {
      addressMap = await this.loadPermitAddresses();
    }
    
    // Process each permit record
    for (const record of records) {
      try {
        // Get or create record type entity
        const recordTypeName = record.RecordType || '';
        let recordType: RecordType;
        if (recordTypeMap.has(recordTypeName)) {
          recordType = recordTypeMap.get(recordTypeName)!;
        } else {
          recordType = RecordType.create(recordTypeName);
          const recordTypeOps = recordType.generateOps(TypeIds.RECORD_TYPE);
          ops.push(...recordTypeOps);
          recordTypeMap.set(recordTypeName, recordType);
        }
        
        // Get or create status entity
        const statusName = record.Status || '';
        let status: Status;
        if (statusMap.has(statusName)) {
          status = statusMap.get(statusName)!;
        } else {
          status = Status.create(statusName);
          const statusOps = status.generateOps(TypeIds.STATUS);
          ops.push(...statusOps);
          statusMap.set(statusName, status);
        }
        
        // Create permit entity
        const permitProperties: PermitProperties = {
          recordNumber: record.RecordNumber,
          description: record.Description || '',
          projectName: record.ProjectName || '',
          address: record.Address || '',
        };
        
        // Override address if available in address map
        if (includeAddresses && addressMap.has(record.RecordNumber)) {
          permitProperties.address = addressMap.get(record.RecordNumber)!;
        }
        
        const permit = Permit.create(permitProperties, TypeIds.PERMIT);
        permit.setRecordType(recordType);
        permit.setStatus(status);
        
        const permitOps = permit.generateOps(
          TypeIds.PERMIT,
          RelationTypeIds.RECORD_TYPE,
          RelationTypeIds.STATUS
        );
        
        ops.push(...permitOps);
        
        this.logger.debug(`Processed permit ${record.RecordNumber}`);
      } catch (error) {
        this.logger.error(`Error processing permit ${record.RecordNumber}: ${error}`);
      }
    }
    
    return ops;
  }
  
  /**
   * Load property addresses from the address mapping file
   * 
   * @returns A map of instrument numbers to property addresses
   */
  private async loadPropertyAddresses(): Promise<Map<string, string>> {
    const addressMap = new Map<string, string>();
    
    try {
      const addressesPath = path.join('data', 'mapping', 'address-mapping.json');
      if (fs.existsSync(addressesPath)) {
        const addressesData = fs.readFileSync(addressesPath, 'utf8');
        const addresses = JSON.parse(addressesData);
        
        for (const [instrumentNumber, address] of Object.entries(addresses)) {
          addressMap.set(instrumentNumber, address as string);
        }
        
        this.logger.info(`Loaded ${addressMap.size} property addresses`);
      } else {
        this.logger.warn('Property address mapping file not found');
      }
    } catch (error) {
      this.logger.error(`Error loading property addresses: ${error}`);
    }
    
    return addressMap;
  }
  
  /**
   * Load permit addresses from the permit address mapping file
   * 
   * @returns A map of record numbers to property addresses
   */
  private async loadPermitAddresses(): Promise<Map<string, string>> {
    const addressMap = new Map<string, string>();
    
    try {
      const addressesPath = path.join('data', 'mapping', 'permit-address-mapping.json');
      if (fs.existsSync(addressesPath)) {
        const addressesData = fs.readFileSync(addressesPath, 'utf8');
        const addresses = JSON.parse(addressesData);
        
        for (const [recordNumber, address] of Object.entries(addresses)) {
          addressMap.set(recordNumber, address as string);
        }
        
        this.logger.info(`Loaded ${addressMap.size} permit addresses`);
      } else {
        this.logger.warn('Permit address mapping file not found');
      }
    } catch (error) {
      this.logger.error(`Error loading permit addresses: ${error}`);
    }
    
    return addressMap;
  }
}
