# New Repository Implementation Guide

This document provides a detailed guide for implementing the new repository structure outlined in `NEW_REPO_STRUCTURE.md`. It includes specific implementation details, code examples, and best practices.

## Initial Setup

### 1. Create the Repository

```bash
mkdir deeds-permits-publisher
cd deeds-permits-publisher
git init
```

### 2. Set Up Node.js Project

```bash
npm init -y
npm install typescript ts-node @types/node --save-dev
npm install @graphprotocol/grc-20 ethers csv-parser dotenv commander
```

### 3. Configure TypeScript

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "outDir": "dist",
    "strict": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Set Up Environment Variables

Create a `.env.example` file:

```
# GRC-20 API
GRC20_API_URL=https://api-testnet.grc-20.thegraph.com

# Wallet
WALLET_PRIVATE_KEY=
WALLET_ADDRESS=

# Space IDs
DEEDS_SPACE_ID=
PERMITS_SPACE_ID=

# RPC Provider
RPC_PROVIDER_URL=https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/
```

### 5. Set Up Git Ignore

Create a `.gitignore` file:

```
node_modules/
dist/
.env
*.log
```

## Core Implementation

### 1. Models

#### Base Model (`src/models/base-model.ts`)

```typescript
/**
 * Base model for all entities
 */
export abstract class BaseModel {
  /**
   * Get the entity ID for this model
   */
  public abstract getEntityId(): string;
  
  /**
   * Get the entity type for this model
   */
  public abstract getEntityType(): string;
  
  /**
   * Get the entity name for this model
   */
  public abstract getEntityName(): string;
  
  /**
   * Get the entity properties for this model
   */
  public abstract getEntityProperties(): Record<string, any>;
}
```

#### Deed Model (`src/models/deed.ts`)

```typescript
import { BaseModel } from './base-model.js';
import { nanoid } from 'nanoid';

/**
 * Deed model
 */
export class Deed extends BaseModel {
  private id: string;
  
  constructor(
    public readonly instrumentNumber: string,
    public readonly directName: string,
    public readonly indirectName: string,
    public readonly recordDate: string,
    public readonly docTypeDescription: string,
    public readonly bookType: string,
    public readonly bookPage: string,
    public readonly legalDescription: string
  ) {
    super();
    this.id = nanoid(22);
  }
  
  public getEntityId(): string {
    return this.id;
  }
  
  public getEntityType(): string {
    return 'Deed';
  }
  
  public getEntityName(): string {
    return `Deed ${this.instrumentNumber}`;
  }
  
  public getEntityProperties(): Record<string, any> {
    return {
      instrumentNumber: this.instrumentNumber,
      directName: this.directName,
      indirectName: this.indirectName,
      recordDate: this.recordDate,
      docTypeDescription: this.docTypeDescription,
      bookType: this.bookType,
      bookPage: this.bookPage,
      legalDescription: this.legalDescription
    };
  }
  
  /**
   * Create a deed from a CSV record
   */
  public static fromCsvRecord(record: any): Deed {
    return new Deed(
      record.InstrumentNumber,
      record.DirectName,
      record.IndirectName,
      record.RecordDate,
      record.DocTypeDescription,
      record.BookType,
      record.BookPage,
      record.LegalDescription
    );
  }
}
```

#### Permit Model (`src/models/permit.ts`)

```typescript
import { BaseModel } from './base-model.js';
import { nanoid } from 'nanoid';

/**
 * Permit model
 */
export class Permit extends BaseModel {
  private id: string;
  
  constructor(
    public readonly recordNumber: string,
    public readonly recordType: string,
    public readonly status: string,
    public readonly date: string,
    public readonly expirationDate: string,
    public readonly address: string,
    public readonly projectName: string,
    public readonly description: string
  ) {
    super();
    this.id = nanoid(22);
  }
  
  public getEntityId(): string {
    return this.id;
  }
  
  public getEntityType(): string {
    return 'Permit';
  }
  
  public getEntityName(): string {
    return `Permit ${this.recordNumber}`;
  }
  
  public getEntityProperties(): Record<string, any> {
    return {
      recordNumber: this.recordNumber,
      recordType: this.recordType,
      status: this.status,
      date: this.date,
      expirationDate: this.expirationDate,
      address: this.address,
      projectName: this.projectName,
      description: this.description
    };
  }
  
  /**
   * Create a permit from a CSV record
   */
  public static fromCsvRecord(record: any): Permit {
    return new Permit(
      record['Record Number'],
      record['Record Type'],
      record.Status,
      record.Date,
      record['Expiration Date'],
      record.Address,
      record['Project Name'],
      record.Description
    );
  }
}
```

### 2. Services

#### Transaction Service (`src/services/transaction-service.ts`)

```typescript
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Transaction service for interacting with the blockchain
 */
export class TransactionService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  
  constructor() {
    const providerUrl = process.env.RPC_PROVIDER_URL || 'https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/';
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY environment variable is required');
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
  }
  
  /**
   * Get the wallet
   */
  public getWallet(): ethers.Wallet {
    return this.wallet;
  }
  
  /**
   * Get the provider
   */
  public getProvider(): ethers.providers.JsonRpcProvider {
    return this.provider;
  }
  
  /**
   * Send a transaction
   */
  public async sendTransaction(to: string, data: string, gasLimit?: ethers.BigNumber): Promise<ethers.providers.TransactionResponse> {
    return this.wallet.sendTransaction({
      to,
      data,
      gasLimit: gasLimit || ethers.BigNumber.from(10000000)
    });
  }
}
```

#### Publish Service (`src/services/publish-service.ts`)

```typescript
import { Graph, Ipfs, Op } from '@graphprotocol/grc-20';
import { TransactionService } from './transaction-service.js';
import { BaseModel } from '../models/base-model.js';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';

/**
 * URL generator for entities
 */
export function generateEntityUrl(spaceId: string, entityId: string): string {
  return `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entityId}`;
}

/**
 * Publish service for publishing entities to GRC-20 spaces
 */
export class PublishService {
  private spaceId: string;
  private mappingFile: string;
  private entityMapping: Record<string, string> = {};
  private transactionService: TransactionService;
  
  constructor(spaceId: string, mappingFile: string) {
    this.spaceId = spaceId;
    this.mappingFile = mappingFile;
    this.transactionService = new TransactionService();
    
    // Load existing entity mapping if it exists
    this.loadEntityMapping();
  }
  
  /**
   * Load entity mapping from file
   */
  private loadEntityMapping(): void {
    try {
      if (fs.existsSync(this.mappingFile)) {
        const data = fs.readFileSync(this.mappingFile, 'utf8');
        this.entityMapping = JSON.parse(data);
        console.log(`Loaded ${Object.keys(this.entityMapping).length} entity mappings from ${this.mappingFile}`);
      }
    } catch (error) {
      console.error(`Error loading entity mapping from ${this.mappingFile}:`, error);
    }
  }
  
  /**
   * Save entity mapping to file
   */
  private saveEntityMapping(): void {
    try {
      const dir = path.dirname(this.mappingFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.mappingFile, JSON.stringify(this.entityMapping, null, 2));
      console.log(`Saved ${Object.keys(this.entityMapping).length} entity mappings to ${this.mappingFile}`);
    } catch (error) {
      console.error(`Error saving entity mapping to ${this.mappingFile}:`, error);
    }
  }
  
  /**
   * Generate a CSV file with entity URLs
   */
  public generateEntityUrlsCsv(outputFile: string): void {
    try {
      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      let csv = 'id,entityId,url\n';
      
      for (const [id, entityId] of Object.entries(this.entityMapping)) {
        const url = generateEntityUrl(this.spaceId, entityId);
        csv += `${id},${entityId},${url}\n`;
      }
      
      fs.writeFileSync(outputFile, csv);
      console.log(`Generated entity URLs CSV at ${outputFile}`);
    } catch (error) {
      console.error(`Error generating entity URLs CSV:`, error);
    }
  }
  
  /**
   * Publish operations to the space
   */
  public async publishOps(ops: Op[], editName: string): Promise<string> {
    console.log(`Publishing ${ops.length} operations to space ${this.spaceId}...`);
    
    try {
      // 1. Publish edit to IPFS
      const cid = await Ipfs.publishEdit({
        name: editName,
        ops: ops,
        author: process.env.WALLET_ADDRESS || '',
      });
      
      console.log(`Published edit to IPFS with CID: ${cid}`);
      
      // 2. Get calldata for the transaction
      const response = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${this.spaceId}/edit/calldata`, {
        method: "POST",
        body: JSON.stringify({ 
          cid: cid,
          network: "TESTNET",
        }),
      });
      
      const { to, data } = await response.json();
      
      try {
        // 3. Send the transaction
        const tx = await this.transactionService.sendTransaction(
          to,
          data,
          ethers.BigNumber.from(10000000)
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        
        // 4. Save entity mapping
        this.saveEntityMapping();
        
        return tx.hash;
      } catch (error: any) {
        console.error('Error sending transaction:', error);
        console.log('Continuing without submitting transaction...');
        
        // Save entity mapping even if transaction fails
        this.saveEntityMapping();
        
        return `Transaction failed: ${error.message || 'Unknown error'}. Entity mapping saved.`;
      }
    } catch (error) {
      console.error('Error publishing operations:', error);
      throw error;
    }
  }
  
  /**
   * Add an entity ID mapping
   */
  public addEntityMapping(id: string, entityId: string): void {
    this.entityMapping[id] = entityId;
  }
  
  /**
   * Get an entity ID from the mapping
   */
  public getEntityId(id: string): string | undefined {
    return this.entityMapping[id];
  }
  
  /**
   * Publish entities to the space
   */
  public async publishEntities(entities: BaseModel[], batchSize: number = 3): Promise<void> {
    const batches = [];
    for (let i = 0; i < entities.length; i += batchSize) {
      batches.push(entities.slice(i, i + batchSize));
    }
    
    let batchNumber = 1;
    for (const batch of batches) {
      console.log(`Processing batch ${batchNumber} with ${batch.length} entities`);
      
      const ops: Op[] = [];
      
      for (const entity of batch) {
        console.log(`Entity object:`, entity.getEntityProperties());
        
        // Add entity ID mapping
        this.addEntityMapping(entity.getEntityProperties().instrumentNumber || entity.getEntityProperties().recordNumber, entity.getEntityId());
        
        // Create entity
        ops.push(
          Graph.createEntity({
            id: entity.getEntityId(),
            name: entity.getEntityName(),
            type: entity.getEntityType(),
          })
        );
        
        // Add properties
        for (const [key, value] of Object.entries(entity.getEntityProperties())) {
          if (value) {
            ops.push(
              Graph.createTriple({
                subject: entity.getEntityId(),
                predicate: key,
                object: value.toString(),
              })
            );
          }
        }
      }
      
      // Publish operations
      await this.publishOps(ops, `Batch ${batchNumber}`);
      console.log(`Published ${ops.length} operations for ${batch.length} entities in batch ${batchNumber}`);
      
      batchNumber++;
    }
  }
}
```

### 3. CLI Commands

#### Publish Entities Command (`src/cli/commands/publish-entities.ts`)

```typescript
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { Deed } from '../../models/deed.js';
import { Permit } from '../../models/permit.js';
import { PublishService } from '../../services/publish-service.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Command to publish entities to GRC-20 spaces
 */
export function publishEntitiesCommand(): Command {
  const command = new Command('publish-entities')
    .description('Publish entities to GRC-20 spaces')
    .argument('<type>', 'Type of entities to publish (deeds, permits, or all)')
    .action(async (type) => {
      console.log('Command environment variables:');
      console.log(`DEEDS_SPACE_ID: ${process.env.DEEDS_SPACE_ID}`);
      console.log(`PERMITS_SPACE_ID: ${process.env.PERMITS_SPACE_ID}`);
      
      // Load environment variables
      dotenv.config();
      console.log('Environment variables loaded:');
      console.log(`DEEDS_SPACE_ID: ${process.env.DEEDS_SPACE_ID}`);
      console.log(`PERMITS_SPACE_ID: ${process.env.PERMITS_SPACE_ID}`);
      
      console.log('Publishing entities...');
      
      if (type === 'deeds' || type === 'all') {
        await publishDeeds();
      }
      
      if (type === 'permits' || type === 'all') {
        await publishPermits();
      }
      
      console.log('Entities published successfully!');
    });
  
  return command;
}

/**
 * Publish deeds to GRC-20 space
 */
async function publishDeeds(): Promise<void> {
  console.log('Publishing deeds to space...');
  
  const deedsSpaceId = process.env.DEEDS_SPACE_ID;
  if (!deedsSpaceId) {
    throw new Error('DEEDS_SPACE_ID environment variable is required');
  }
  
  const publishService = new PublishService(
    deedsSpaceId,
    path.join(process.cwd(), 'data', 'mapping', 'deed-entity-mapping.json')
  );
  
  const deeds: Deed[] = await readDeedsCsv();
  
  await publishService.publishEntities(deeds);
  
  publishService.generateEntityUrlsCsv(
    path.join(process.cwd(), 'data', 'output', 'deed-entity-urls.csv')
  );
  
  console.log('Generated deed entity URLs CSV');
}

/**
 * Publish permits to GRC-20 space
 */
async function publishPermits(): Promise<void> {
  console.log('Publishing permits to space...');
  
  const permitsSpaceId = process.env.PERMITS_SPACE_ID;
  if (!permitsSpaceId) {
    throw new Error('PERMITS_SPACE_ID environment variable is required');
  }
  
  const publishService = new PublishService(
    permitsSpaceId,
    path.join(process.cwd(), 'data', 'mapping', 'permit-entity-mapping.json')
  );
  
  const permits: Permit[] = await readPermitsCsv();
  
  await publishService.publishEntities(permits);
  
  publishService.generateEntityUrlsCsv(
    path.join(process.cwd(), 'data', 'output', 'permit-entity-urls.csv')
  );
  
  console.log('Generated permit entity URLs CSV');
}

/**
 * Read deeds from CSV file
 */
async function readDeedsCsv(): Promise<Deed[]> {
  const deeds: Deed[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(process.cwd(), 'data', 'input', 'deeds.csv'))
      .pipe(csv())
      .on('data', (data) => {
        deeds.push(Deed.fromCsvRecord(data));
      })
      .on('end', () => {
        console.log(`Read ${deeds.length} deeds from CSV`);
        resolve(deeds);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Read permits from CSV file
 */
async function readPermitsCsv(): Promise<Permit[]> {
  const permits: Permit[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(process.cwd(), 'data', 'input', 'permits.csv'))
      .pipe(csv())
      .on('data', (data) => {
        permits.push(Permit.fromCsvRecord(data));
      })
      .on('end', () => {
        console.log(`Read ${permits.length} permits from CSV`);
        resolve(permits);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
```

### 4. Scripts

#### Publish Entities Script (`scripts/publish-entities.ts`)

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { publishEntitiesCommand } from '../src/cli/commands/publish-entities.js';

const program = new Command();

program
  .name('deeds-permits-publisher')
  .description('CLI for publishing deeds and permits to GRC-20 spaces')
  .version('1.0.0');

program.addCommand(publishEntitiesCommand());

program.parse(process.argv);
```

### 5. Package.json Scripts

Update `package.json` to include the following scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/scripts/publish-entities.js",
    "publish-deeds": "node dist/scripts/publish-entities.js deeds",
    "publish-permits": "node dist/scripts/publish-entities.js permits",
    "publish-all": "node dist/scripts/publish-entities.js all"
  }
}
```

## Migration Process

### 1. Export Data from Current Repository

1. Copy the CSV files from the current repository to the new repository:
   - `data/GRC20_Deeds.csv` -> `data/input/deeds.csv`
   - `data/permits.csv` -> `data/input/permits.csv`

2. Copy the entity mappings from the current repository to the new repository:
   - `data/entity-ids.json` -> `data/mapping/deed-entity-mapping.json`
   - `data/permit-entity-ids.json` -> `data/mapping/permit-entity-mapping.json`

### 2. Test the New Implementation

1. Build the project:
   ```bash
   npm run build
   ```

2. Run the publish commands:
   ```bash
   npm run publish-deeds
   npm run publish-permits
   ```

3. Verify the output CSV files:
   - `data/output/deed-entity-urls.csv`
   - `data/output/permit-entity-urls.csv`

### 3. Switch to the New Repository

Once the new implementation is verified, switch to using the new repository for all future work.

## Conclusion

This implementation guide provides a detailed roadmap for creating a new, clean repository for publishing deeds and permits to GRC-20 spaces. By following this guide, you can create a well-structured, maintainable codebase that leverages the lessons learned from the current implementation.
